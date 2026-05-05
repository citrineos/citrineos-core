// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Inject, Injectable, Logger } from '@nestjs/common';
import { BootRepository } from '@repositories/boot.repository';
import { ChargingStationRepository } from '@repositories/charging-station.repository';
import {
  BootMapper,
  BootNotificationResponseDto,
  BootNotification16ResponseDto,
} from '@mappers/provisioning/boot.mapper';
import { BootNotificationRequest } from '@dto/provisioning/boot-notification.request';
import { BootNotification16Request } from '@dto/provisioning/boot-notification-16.request';
import { BootNotificationStatusEnum16 } from '@enums/boot-notification-status-16.enum';
import { RegistrationStatusEnumType } from '@enums/registration-status.enum';
import { OCPP_CallAction } from '@ocpp/call-action';
import { CONFIGURATION_MODULE_CONFIG } from '@modules/config/config.tokens';
import type { ConfigurationModuleConfig } from '@modules/config/config.schema';
import { CacheService } from '@cache/cache.service';
import { BOOT_STATUS, CacheNamespace } from '@cache/cache.constants';
import { OCPPVersion } from '@ocpp/ocpp-version';

/**
 * Actions that can be sent during the BootNotification window — kept in a
 * blacklist while the charger is in Pending/Rejected state. Mirrors the
 * legacy `OCPP2_0_1_CALL_SCHEMA_RECORD` set used by `cacheChargerActionsPermissions`.
 */
const BLACKLISTABLE_ACTIONS_201: OCPP_CallAction[] = [
  OCPP_CallAction.Authorize,
  OCPP_CallAction.DataTransfer,
  OCPP_CallAction.FirmwareStatusNotification,
  OCPP_CallAction.Get15118EVCertificate,
  OCPP_CallAction.GetCertificateStatus,
  OCPP_CallAction.Heartbeat,
  OCPP_CallAction.LogStatusNotification,
  OCPP_CallAction.MeterValues,
  OCPP_CallAction.NotifyChargingLimit,
  OCPP_CallAction.NotifyCustomerInformation,
  OCPP_CallAction.NotifyDisplayMessages,
  OCPP_CallAction.NotifyEVChargingNeeds,
  OCPP_CallAction.NotifyEVChargingSchedule,
  OCPP_CallAction.NotifyEvent,
  OCPP_CallAction.NotifyMonitoringReport,
  OCPP_CallAction.NotifyReport,
  OCPP_CallAction.PublishFirmwareStatusNotification,
  OCPP_CallAction.ReportChargingProfiles,
  OCPP_CallAction.ReservationStatusUpdate,
  OCPP_CallAction.SecurityEventNotification,
  OCPP_CallAction.SignCertificate,
  OCPP_CallAction.StatusNotification,
  OCPP_CallAction.TransactionEvent,
];

/**
 * Boot orchestration service.
 *
 * Mirrors `core/src/modules/Configuration/src/module/BootNotificationService.ts`.
 * Decides response status (autoAccept / Pending state machine), toggles the
 * action blacklist, and writes the Boot + ChargingStation rows. All
 * entity↔DTO translation is delegated to `BootMapper`.
 */
@Injectable()
export class BootService {
  private readonly logger = new Logger(BootService.name);

  constructor(
    private readonly bootRepo: BootRepository,
    private readonly stationRepo: ChargingStationRepository,
    private readonly cache: CacheService,
    @Inject(CONFIGURATION_MODULE_CONFIG) private readonly cfg: ConfigurationModuleConfig,
  ) {}

  /**
   * Build a BootNotificationResponse for OCPP 2.0.1 / 2.1.
   *
   * Status precedence:
   *   1. Existing Boot row's `status` if set,
   *   2. else `unknownChargerStatus` from the OCPP-version-specific module config.
   *
   * Pending → Accepted promotion happens here when no follow-up traffic is
   * required (no GetBaseReport, no SetVariables) and `autoAccept` is on.
   */
  async createBootNotificationResponse(
    tenantId: number,
    stationId: string,
    protocol: OCPPVersion.OCPP2_0_1 | OCPPVersion.OCPP2_1 = OCPPVersion.OCPP2_0_1,
  ): Promise<BootNotificationResponseDto> {
    const boot = await this.bootRepo.findByStationId(tenantId, stationId);

    const versionConfig = protocol === OCPPVersion.OCPP2_1 ? this.cfg.ocpp2_1 : this.cfg.ocpp2_0_1;
    const unknownChargerStatus =
      versionConfig?.unknownChargerStatus ?? RegistrationStatusEnumType.Accepted;
    const autoAccept = versionConfig?.autoAccept ?? true;
    const getBaseReportOnPendingDefault = versionConfig?.getBaseReportOnPending ?? true;

    let status: RegistrationStatusEnumType =
      (boot?.status as RegistrationStatusEnumType) ?? unknownChargerStatus;

    if (status === RegistrationStatusEnumType.Pending) {
      const needToGetBaseReport =
        boot?.getBaseReportOnPending !== null && boot?.getBaseReportOnPending !== undefined
          ? boot.getBaseReportOnPending
          : getBaseReportOnPendingDefault;
      const pendingSetVars = (boot?.variablesRejectedOnLastBoot ?? null) as unknown[] | null;
      const needToSetVariables = Array.isArray(pendingSetVars) && pendingSetVars.length > 0;
      if (!needToGetBaseReport && !needToSetVariables && autoAccept) {
        status = RegistrationStatusEnumType.Accepted;
      }
    }

    return BootMapper.toBootNotificationResponse(boot, status, {
      heartbeat: this.cfg.heartbeatInterval,
      bootRetry: this.cfg.bootRetryInterval,
    });
  }

  /**
   * Toggle the per-station action blacklist in the cache. Mirrors legacy
   * `cacheChargerActionsPermissions`.
   */
  async cacheChargerActionsPermissions(
    stationId: string,
    cachedBootStatus: RegistrationStatusEnumType | null,
    bootNotificationResponseStatus: RegistrationStatusEnumType,
  ): Promise<void> {
    if (bootNotificationResponseStatus === RegistrationStatusEnumType.Accepted) {
      if (cachedBootStatus) {
        await Promise.all(
          BLACKLISTABLE_ACTIONS_201.map((action) => this.cache.remove(action, stationId)),
        );
        await this.cache.remove(BOOT_STATUS, stationId);
        this.logger.debug(`Cleared boot blacklist for ${stationId} (was ${cachedBootStatus})`);
      }
    } else if (!cachedBootStatus) {
      await Promise.all(
        BLACKLISTABLE_ACTIONS_201.map((action) => this.cache.set(action, 'blacklisted', stationId)),
      );
      this.logger.debug(
        `Set boot blacklist for ${stationId} (status=${bootNotificationResponseStatus})`,
      );
    }
  }

  /**
   * OCPP 2.0.1 / 2.1: persist ChargingStation metadata + Boot row.
   * Mirrors the fire-and-forget write block in legacy `_handleBootNotification`.
   *
   * Honors the per-connection `allowUnknownChargingStations` flag stashed
   * in the Connections cache by `OcppRouterService` on WS connect — when
   * the policy is `false` and the station isn't already in the DB, we
   * skip the upsert (legacy throws inside the background task; we degrade
   * to a warning log since the response was already sent).
   */
  async updateBootRecord(
    tenantId: number,
    stationId: string,
    response: BootNotificationResponseDto,
    chargingStation: BootNotificationRequest['chargingStation'],
  ): Promise<void> {
    if (!(await this.isChargingStationPersistAllowed(tenantId, stationId))) return;
    await this.stationRepo.upsert(
      BootMapper.stationFromBootNotificationRequest(stationId, tenantId, chargingStation),
    );
    await this.bootRepo.upsert(
      BootMapper.fromBootNotificationResponse(stationId, tenantId, response),
    );
  }

  /**
   * Returns true when the BootNotification persistence path is allowed
   * to write (or update) the ChargingStation row.
   *
   * Two cases let it through:
   *   1. WS connection metadata says `allowUnknownChargingStations=true`
   *      (the operator opted in to first-contact provisioning).
   *   2. The station already exists in the DB (boot from a known charger
   *      — the policy only gates *creation*).
   *
   * If the connection metadata is missing entirely (cache eviction,
   * Redis misconfiguration, etc.) we default to "allow" since legacy
   * treats the absence of a connection record as no-policy-set rather
   * than a hard reject.
   */
  private async isChargingStationPersistAllowed(
    tenantId: number,
    stationId: string,
  ): Promise<boolean> {
    const connRaw = await this.cache.get<string>(stationId, CacheNamespace.Connections);
    if (!connRaw) return true;
    const conn = JSON.parse(connRaw) as { allowUnknownChargingStations?: boolean };
    if (conn.allowUnknownChargingStations !== false) return true;
    const existing = await this.stationRepo.findById(tenantId, stationId);
    if (existing) return true;
    this.logger.warn(
      `BootNotification ${stationId}: skipping ChargingStation persist — allowUnknownChargingStations=false and no existing row.`,
    );
    return false;
  }

  /**
   * OCPP 1.6 BootNotification: status from the Boot row (or fallback to
   * `unknownChargerStatus`), persist ChargingStation in background.
   * Mirrors legacy `BootNotificationService.createOcpp16BootNotificationResponse`.
   */
  async createBootNotification16Response(
    tenantId: number,
    stationId: string,
    chargingStation: BootNotification16Request,
  ): Promise<BootNotification16ResponseDto> {
    const boot = await this.bootRepo.findByStationId(tenantId, stationId);
    const fallback =
      (this.cfg.ocpp1_6?.unknownChargerStatus as BootNotificationStatusEnum16) ??
      BootNotificationStatusEnum16.Accepted;
    const status = (boot?.status as BootNotificationStatusEnum16) ?? fallback;

    void this.isChargingStationPersistAllowed(tenantId, stationId)
      .then(async (allowed) => {
        if (!allowed) return;
        await this.stationRepo.upsert(
          BootMapper.stationFromBootNotification16Request(stationId, tenantId, chargingStation),
        );
      })
      .catch((err) =>
        this.logger.error(`Failed to upsert station for ${stationId}: ${(err as Error).message}`),
      );

    return BootMapper.toBootNotification16Response(boot, status, {
      heartbeat: this.cfg.heartbeatInterval,
      bootRetry: this.cfg.bootRetryInterval,
    });
  }

  async getCachedBootStatus(stationId: string): Promise<RegistrationStatusEnumType | null> {
    const cached = await this.cache.get<string>(BOOT_STATUS, stationId);
    if (!cached) return null;
    return cached as RegistrationStatusEnumType;
  }

  async cacheBootStatus(stationId: string, status: RegistrationStatusEnumType): Promise<void> {
    await this.cache.set(BOOT_STATUS, status, stationId);
  }
}

/** Backwards-compat: handlers still import this from the service. */
export type BootNotificationResponse = BootNotificationResponseDto;
