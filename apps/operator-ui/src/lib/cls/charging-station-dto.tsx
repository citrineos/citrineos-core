// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type ChargingStationCapabilityEnumType,
  type ChargingStationDto,
  type ChargingStationParkingRestrictionEnumType,
  type ChargingStationStatusEnumType,
  type ConnectorDto,
  type ConnectorStatusEnumType,
  type EvseDto,
  type LatestStatusNotificationDto,
  type LocationDto,
  type StatusNotificationDto,
  ChargingStateEnum,
  ChargingStationSchema,
  ChargingStationStatusEnum,
  ConnectorStatusEnum,
  LatestStatusNotificationSchema,
  LocationSchema,
  TransactionSchema,
} from '@citrineos/types';
import { Expose } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import type { Point } from 'geojson';
import { z } from 'zod';

const ChargingStationDetailsSchema = ChargingStationSchema.extend({
  location: LocationSchema.omit({ chargingPool: true }).optional(),
  statusNotifications: z.array(LatestStatusNotificationSchema).optional(),
  transactions: z.array(TransactionSchema.omit({ station: true, location: true })).optional(),
  connectedWebsocketServerConfigId: z.string().nullish(),
  // The websocket server (ServerNetworkProfile) the station is currently connected on — safe fields only.
  connectedServerNetworkProfile: z
    .object({
      id: z.string(),
      host: z.string().nullish(),
      port: z.number().nullish(),
      protocols: z.array(z.string()).nullish(),
      securityProfile: z.number().nullish(),
      allowUnknownChargingStations: z.boolean().nullish(),
    })
    .nullish(),
  // Network profiles pushed to the station (SetNetworkProfiles), used to resolve the security
  // profile actually configured for the connected server config.
  setNetworkProfiles: z
    .array(
      z.object({
        websocketServerConfigId: z.string().nullish(),
        securityProfile: z.number().nullish(),
      }),
    )
    .nullish(),
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
  connectedWebsocketServerConfigId?: string | null;
  @Expose({ name: 'ConnectedServerNetworkProfile' })
  connectedServerNetworkProfile?: {
    id: string;
    host?: string;
    port?: number;
    protocols?: string[];
    securityProfile?: number;
    allowUnknownChargingStations?: boolean;
  } | null;
  @Expose({ name: 'SetNetworkProfiles' })
  setNetworkProfiles?:
    | {
        websocketServerConfigId?: string | null;
        securityProfile?: number | null;
      }[]
    | null;
}

export type ChargingStationStatusCounts = Record<ChargingStationStatusEnumType, number>;

/**
 * Order in which a station's aggregated status is picked when its EVSEs disagree.
 */
const STATUS_PRIORITY: ChargingStationStatusEnumType[] = [
  ChargingStationStatusEnum.FAULTED,
  ChargingStationStatusEnum.CHARGING,
  ChargingStationStatusEnum.AVAILABLE,
  ChargingStationStatusEnum.CHARGING_SUSPENDED,
  ChargingStationStatusEnum.RESERVED,
  ChargingStationStatusEnum.UNAVAILABLE,
];

export const getChargingStationStatus = (
  chargingStation: ChargingStationStatusCountsDto,
): ChargingStationStatusEnumType | undefined => {
  const counts = getChargingStationStatusCounts(chargingStation);
  return STATUS_PRIORITY.find((status) => counts[status] > 0);
};

const connectorStatusToChargingStationStatus = (
  connectorStatus: ConnectorStatusEnumType,
  activeTransaction: { isActive?: boolean; chargingState?: string | null } | undefined,
): ChargingStationStatusEnumType => {
  switch (connectorStatus) {
    case ConnectorStatusEnum.Available:
      return ChargingStationStatusEnum.AVAILABLE;
    case ConnectorStatusEnum.Charging:
      return ChargingStationStatusEnum.CHARGING;
    case ConnectorStatusEnum.Preparing:
    case ConnectorStatusEnum.SuspendedEV:
    case ConnectorStatusEnum.SuspendedEVSE:
    case ConnectorStatusEnum.Finishing:
      return ChargingStationStatusEnum.CHARGING_SUSPENDED;
    case ConnectorStatusEnum.Occupied:
      return activeTransaction?.isActive &&
        activeTransaction.chargingState === ChargingStateEnum.Charging
        ? ChargingStationStatusEnum.CHARGING
        : ChargingStationStatusEnum.CHARGING_SUSPENDED;
    case ConnectorStatusEnum.Reserved:
      return ChargingStationStatusEnum.RESERVED;
    case ConnectorStatusEnum.Faulted:
      return ChargingStationStatusEnum.FAULTED;
    case ConnectorStatusEnum.Unavailable:
    case ConnectorStatusEnum.Unknown:
      return ChargingStationStatusEnum.UNAVAILABLE;
  }
};

export const getChargingStationStatusCounts = (chargingStation: ChargingStationStatusCountsDto) => {
  const counts: ChargingStationStatusCounts = {
    [ChargingStationStatusEnum.AVAILABLE]: 0,
    [ChargingStationStatusEnum.CHARGING]: 0,
    [ChargingStationStatusEnum.CHARGING_SUSPENDED]: 0,
    [ChargingStationStatusEnum.RESERVED]: 0,
    [ChargingStationStatusEnum.UNAVAILABLE]: 0,
    [ChargingStationStatusEnum.FAULTED]: 0,
  };
  const evses = chargingStation?.evses;
  if (evses && evses.length > 0) {
    for (const evse of evses) {
      let latestStatusNotificationForEvse: StatusNotificationDto | undefined;
      chargingStation?.statusNotifications?.forEach((statusNotificationForStation) => {
        if (
          statusNotificationForStation.statusNotification?.evseId === evse.evseTypeId &&
          statusNotificationForStation.statusNotification?.connectorId ===
            evse.connectors?.[0]?.evseTypeConnectorId
        ) {
          latestStatusNotificationForEvse = statusNotificationForStation.statusNotification;
        }
      });
      if (latestStatusNotificationForEvse) {
        const connectorStatus: ConnectorStatusEnumType =
          latestStatusNotificationForEvse?.connectorStatus || ConnectorStatusEnum.Unavailable;
        const activeTransaction = (chargingStation as ChargingStationClass)?.transactions?.find(
          (transaction) => transaction.evseId === evse.id,
        );
        counts[connectorStatusToChargingStationStatus(connectorStatus, activeTransaction)]++;
      } else {
        counts[ChargingStationStatusEnum.UNAVAILABLE]++;
      }
    }
  }
  return counts;
};
