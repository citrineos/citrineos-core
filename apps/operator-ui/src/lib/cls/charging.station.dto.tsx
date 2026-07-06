// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  ChargingStationCapabilityEnumType,
  ChargingStationDto,
  ChargingStationParkingRestrictionEnumType,
  ConnectorDto,
  ConnectorStatusEnumType,
  EvseDto,
  LatestStatusNotificationDto,
  LocationDto,
  StatusNotificationDto,
} from '@citrineos/base';
import {
  ChargingStationSchema,
  LatestStatusNotificationSchema,
  LocationSchema,
  OCPP2_0_1,
  TransactionSchema,
} from '@citrineos/base';
import { Expose } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import type { Point } from 'geojson';
import { z } from 'zod';

const ChargingStationDetailsSchema = ChargingStationSchema.extend({
  location: LocationSchema.omit({ chargingPool: true }).optional(),
  statusNotifications: z.array(LatestStatusNotificationSchema).optional(),
  transactions: z.array(TransactionSchema.omit({ station: true, location: true })).optional(),
});

export const ChargingStationDetailsProps = ChargingStationDetailsSchema.keyof().enum;

export type ChargingStationDetailsDto = z.infer<typeof ChargingStationDetailsSchema>;

const ChargingStationStatusCountsSchema = ChargingStationSchema.extend({
  statusNotifications: z.array(LatestStatusNotificationSchema).optional(),
});

export type ChargingStationStatusCountsDto = z.infer<typeof ChargingStationStatusCountsSchema>;

export class ChargingStationClass implements Partial<ChargingStationDto> {
  id!: number;
  ocppConnectionName!: string;
  @IsBoolean()
  isOnline!: boolean;
  protocol?: any;
  chargePointVendor?: string | null;
  chargePointModel?: string | null;
  chargePointSerialNumber?: string | null;
  chargeBoxSerialNumber?: string | null;
  firmwareVersion?: string | null;
  iccid?: string | null;
  imsi?: string | null;
  meterType?: string | null;
  meterSerialNumber?: string | null;
  coordinates?: Point | null;
  floorLevel?: string | null;
  parkingRestrictions?: ChargingStationParkingRestrictionEnumType[] | null;
  capabilities?: ChargingStationCapabilityEnumType[] | null;
  locationId?: number | null;
  @Expose({ name: 'LatestStatusNotifications' })
  statusNotifications?: LatestStatusNotificationDto[] | null;
  evses?: EvseDto[] | null;
  connectors?: ConnectorDto[] | null;
  // TODO: Add missing properties from ChargingStationDto
  location?: LocationDto;
  networkProfiles?: any;
  transactions?: any[] | null;
}

// TODO: Add missing enums and types for local use
export enum ChargingStationStatus {
  CHARGING = 'CHARGING',
  CHARGING_SUSPENDED = 'CHARGING_SUSPENDED',
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  FAULTED = 'FAULTED',
}

export interface ChargingStationStatusCounts {
  [ChargingStationStatus.CHARGING]: number;
  [ChargingStationStatus.CHARGING_SUSPENDED]: number;
  [ChargingStationStatus.AVAILABLE]: number;
  [ChargingStationStatus.UNAVAILABLE]: number;
  [ChargingStationStatus.FAULTED]: number;
}

export const getChargingStationStatus = (chargingStation: ChargingStationStatusCountsDto) => {
  const counts = getChargingStationStatusCounts(chargingStation);

  if (counts[ChargingStationStatus.FAULTED] > 0) {
    return ChargingStationStatus.FAULTED;
  } else if (counts[ChargingStationStatus.CHARGING] > 0) {
    return ChargingStationStatus.CHARGING;
  } else if (counts[ChargingStationStatus.AVAILABLE] > 0) {
    return ChargingStationStatus.AVAILABLE;
  } else if (counts[ChargingStationStatus.CHARGING_SUSPENDED] > 0) {
    return ChargingStationStatus.CHARGING_SUSPENDED;
  } else if (counts[ChargingStationStatus.UNAVAILABLE] > 0) {
    return ChargingStationStatus.UNAVAILABLE;
  }
};

export const getChargingStationStatusCounts = (chargingStation: ChargingStationStatusCountsDto) => {
  const counts: ChargingStationStatusCounts = {
    [ChargingStationStatus.CHARGING]: 0,
    [ChargingStationStatus.CHARGING_SUSPENDED]: 0,
    [ChargingStationStatus.AVAILABLE]: 0,
    [ChargingStationStatus.UNAVAILABLE]: 0,
    [ChargingStationStatus.FAULTED]: 0,
  };
  const evses = chargingStation?.evses;
  if (evses && evses.length > 0) {
    for (const evse of evses) {
      let latestStatusNotificationForEvse: StatusNotificationDto | undefined;
      chargingStation?.statusNotifications?.forEach((statusNotificationForStation) => {
        if (
          statusNotificationForStation.statusNotification?.evseId === parseInt(evse.evseId) &&
          statusNotificationForStation.statusNotification?.connectorId ===
            evse.connectors?.[0]?.connectorId
        ) {
          latestStatusNotificationForEvse = statusNotificationForStation.statusNotification;
        }
      });
      if (latestStatusNotificationForEvse) {
        const connectorStatus: ConnectorStatusEnumType =
          latestStatusNotificationForEvse?.connectorStatus ||
          OCPP2_0_1.ConnectorStatusEnumType.Unavailable;
        switch (connectorStatus) {
          case OCPP2_0_1.ConnectorStatusEnumType.Available:
            counts[ChargingStationStatus.AVAILABLE]++;
            break;
          case OCPP2_0_1.ConnectorStatusEnumType.Occupied: {
            const activeTransaction = (chargingStation as ChargingStationClass)?.transactions?.find(
              (transaction) => transaction.evseId === evse.id,
            );
            if (activeTransaction && activeTransaction.isActive) {
              const chargingState = activeTransaction.chargingState;
              if (chargingState === OCPP2_0_1.ChargingStateEnumType.Charging) {
                counts[ChargingStationStatus.CHARGING]++;
              } else {
                counts[ChargingStationStatus.CHARGING_SUSPENDED]++;
              }
            } else {
              counts[ChargingStationStatus.CHARGING_SUSPENDED]++;
            }
            break;
          }
          case OCPP2_0_1.ConnectorStatusEnumType.Faulted:
            counts[ChargingStationStatus.FAULTED]++;
            break;
          case OCPP2_0_1.ConnectorStatusEnumType.Unavailable:
            counts[ChargingStationStatus.UNAVAILABLE]++;
            break;
          case OCPP2_0_1.ConnectorStatusEnumType.Reserved:
          default:
            // no handling
            break;
        }
      } else {
        counts[ChargingStationStatus.UNAVAILABLE]++;
      }
    }
  }
  return counts;
};
