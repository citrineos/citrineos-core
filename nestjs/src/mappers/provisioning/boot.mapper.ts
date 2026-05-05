// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Boot, NewBoot } from '@entities/boot.entity';
import { NewChargingStation } from '@entities/charging-station.entity';
import { BootNotificationStatusEnum16 } from '@enums/boot-notification-status-16.enum';
import { RegistrationStatusEnumType } from '@enums/registration-status.enum';
import { BootNotification16Request } from '@dto/provisioning/boot-notification-16.request';
import { BootNotificationRequest } from '@dto/provisioning/boot-notification.request';

/**
 * OCPP 2.0.1 / 2.1 BootNotification response — the wire shape sent back
 * to the charger. `statusInfo` is omitted unless we have one cached.
 */
export interface BootNotificationResponseDto extends Record<string, unknown> {
  currentTime: string;
  status: RegistrationStatusEnumType;
  interval: number;
  statusInfo?: { reasonCode: string; additionalInfo?: string };
}

/** OCPP 1.6 BootNotification response. */
export interface BootNotification16ResponseDto extends Record<string, unknown> {
  currentTime: string;
  status: BootNotificationStatusEnum16;
  interval: number;
}

/**
 * Maps between the `Boot` entity and OCPP wire DTOs.
 *
 * Mirrors `core/src/dal/layers/sequelize/model/Boot.ts` + the
 * `OCPP2_0_1_Mapper.BootMapper` / `OCPP1_6_Mapper.BootMapper` pair from
 * `@dal/layers/sequelize`. Keeping the mapping here means handlers and
 * services never reach for `Boot.statusInfo` raw — they go through this.
 */
export class BootMapper {
  /**
   * Build the OCPP 2.0.1 / 2.1 response from a Boot row + interval defaults.
   * Used by `BootService.createBootNotificationResponse` after the status
   * has been computed (Pending → Accepted promotion happens upstream).
   */
  static toBootNotificationResponse(
    boot: Boot | undefined,
    status: RegistrationStatusEnumType,
    intervals: { heartbeat: number; bootRetry: number },
  ): BootNotificationResponseDto {
    const interval =
      status === RegistrationStatusEnumType.Accepted
        ? boot?.heartbeatInterval ?? intervals.heartbeat
        : boot?.bootRetryInterval ?? intervals.bootRetry;

    const dto: BootNotificationResponseDto = {
      currentTime: new Date().toISOString(),
      status,
      interval,
    };
    if (boot?.statusInfo) {
      dto.statusInfo = boot.statusInfo as { reasonCode: string; additionalInfo?: string };
    }
    return dto;
  }

  /** OCPP 1.6 variant — different status enum, no statusInfo. */
  static toBootNotification16Response(
    boot: Boot | undefined,
    status: BootNotificationStatusEnum16,
    intervals: { heartbeat: number; bootRetry: number },
  ): BootNotification16ResponseDto {
    const interval =
      status === BootNotificationStatusEnum16.Accepted
        ? boot?.heartbeatInterval ?? intervals.heartbeat
        : boot?.bootRetryInterval ?? intervals.bootRetry;
    return { currentTime: new Date().toISOString(), status, interval };
  }

  /**
   * Build the Boot row to upsert after a 2.0.1 response. Only the fields
   * the response can actually set are written — status state-machine
   * fields (getBaseReportOnPending, etc.) are left untouched here.
   */
  static fromBootNotificationResponse(
    stationId: string,
    tenantId: number,
    response: BootNotificationResponseDto,
  ): NewBoot {
    return {
      // The Boot row's primary key IS the stationId (legacy uses
      // `id` directly, not a separate stationId column).
      id: stationId,
      tenantId,
      lastBootTime: new Date(response.currentTime),
      status: response.status,
      statusInfo: response.statusInfo ?? null,
      heartbeatInterval:
        response.status === RegistrationStatusEnumType.Accepted ? response.interval : null,
      bootRetryInterval:
        response.status !== RegistrationStatusEnumType.Accepted ? response.interval : null,
      updatedAt: new Date(),
    };
  }

  /**
   * Build the ChargingStation row to upsert from the OCPP 2.0.1 / 2.1
   * `chargingStation` payload of a BootNotification request.
   */
  static stationFromBootNotificationRequest(
    stationId: string,
    tenantId: number,
    chargingStation: BootNotificationRequest['chargingStation'],
  ): NewChargingStation {
    return {
      id: stationId,
      tenantId,
      isOnline: true,
      chargePointVendor: chargingStation.vendorName ?? null,
      chargePointModel: chargingStation.model ?? null,
      chargePointSerialNumber: chargingStation.serialNumber ?? null,
      firmwareVersion: chargingStation.firmwareVersion ?? null,
      iccid: chargingStation.modem?.iccid ?? null,
      imsi: chargingStation.modem?.imsi ?? null,
      updatedAt: new Date(),
    };
  }

  /**
   * OCPP 1.6 variant — flat fields directly from the BootNotification request,
   * including chargeBoxSerialNumber / meterType / meterSerialNumber that 2.0.1
   * doesn't carry.
   */
  static stationFromBootNotification16Request(
    stationId: string,
    tenantId: number,
    request: BootNotification16Request,
  ): NewChargingStation {
    return {
      id: stationId,
      tenantId,
      isOnline: true,
      chargePointVendor: request.chargePointVendor ?? null,
      chargePointModel: request.chargePointModel ?? null,
      chargePointSerialNumber: request.chargePointSerialNumber ?? null,
      chargeBoxSerialNumber: request.chargeBoxSerialNumber ?? null,
      firmwareVersion: request.firmwareVersion ?? null,
      iccid: request.iccid ?? null,
      imsi: request.imsi ?? null,
      meterType: request.meterType ?? null,
      meterSerialNumber: request.meterSerialNumber ?? null,
      updatedAt: new Date(),
    };
  }
}
