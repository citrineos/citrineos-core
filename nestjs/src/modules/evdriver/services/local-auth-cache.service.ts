// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable, Logger } from '@nestjs/common';
import { BOOT_STATUS } from '@cache/cache.constants';
import { CacheService } from '@cache/cache.service';
import { OCPP_CallAction } from '@ocpp/call-action';

/**
 * Clears the CSMS-side cache entries that mirror what the charger
 * caches: BOOT_STATUS and per-action blacklist flags. Invoked when an
 * operator hits a `ClearCache` REST endpoint — we propagate the OCPP
 * CALL to the charger AND clear our own state in the same operation so
 * the next interaction is fresh on both sides.
 *
 * Mirrors legacy `_clearChargerCache` semantics on the CSMS side.
 */
@Injectable()
export class LocalAuthCacheService {
  private readonly logger = new Logger(LocalAuthCacheService.name);

  /**
   * Same set of actions `BootService.cacheChargerActionsPermissions`
   * blacklists on a non-Accepted boot — clearing them on operator
   * request is the inverse operation.
   */
  private static readonly BLACKLISTED_ACTIONS: OCPP_CallAction[] = [
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

  constructor(private readonly cache: CacheService) {}

  async clearForStation(stationId: string): Promise<void> {
    await Promise.all([
      this.cache.remove(BOOT_STATUS, stationId),
      ...LocalAuthCacheService.BLACKLISTED_ACTIONS.map((action) =>
        this.cache.remove(action, stationId),
      ),
    ]);
    this.logger.debug(`Cleared local CSMS cache for ${stationId}`);
  }

  async clearForStations(stationIds: string[]): Promise<void> {
    await Promise.all(stationIds.map((id) => this.clearForStation(id)));
  }
}
