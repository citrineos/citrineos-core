// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React, { useState } from 'react';
import {
  type ChargingStationDto,
  type ConnectorStatusEnumType,
  type EvseDto,
  ConnectorStatusEnum,
} from '@citrineos/base';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import { LatestStatusNotificationClass } from '@lib/cls/latest.status.notification.dto';
import { GET_CHARGING_STATIONS_WITH_LOCATION_AND_LATEST_STATUS_NOTIFICATIONS_AND_TRANSACTIONS } from '@lib/queries/charging.stations';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { useGqlCustom } from '@lib/utils/use-gql-custom';
import { CanAccess, useTranslate } from '@refinedev/core';
import { plainToInstance } from 'class-transformer';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { ChargerActivityStationsSheet } from '@lib/client/pages/overview/charger-activity/charger.activity.stations.sheet';
import { heading2Style } from '@lib/client/styles/page';
import { PercentageCircle } from '@lib/client/pages/overview/percentage-circle/percentage.circle';
import { ChargerStatusEnum } from '@lib/utils/enums';
import { OverviewCardSkeleton } from '@lib/client/pages/overview/overview.card.skeleton';
import { AccessDeniedFallbackCard } from '@lib/client/components/access-denied-fallback-card';

interface ChargerItem {
  station: ChargingStationDto;
  evse: EvseDto;
  lastStatus?: ChargerStatusEnum;
}

const statusPriority: Record<ChargerStatusEnum, number> = {
  [ChargerStatusEnum.AVAILABLE]: 1,
  [ChargerStatusEnum.CHARGING]: 2,
  [ChargerStatusEnum.CHARGING_SUSPENDED]: 3,
  [ChargerStatusEnum.UNAVAILABLE]: 4,
  [ChargerStatusEnum.FAULTED]: 5,
  [ChargerStatusEnum.OFFLINE]: 6,
  [ChargerStatusEnum.ONLINE]: 7,
};

interface OnlineStatusCounts {
  [ChargerStatusEnum.CHARGING]: { count: number; items: Array<ChargerItem> };
  [ChargerStatusEnum.CHARGING_SUSPENDED]: {
    count: number;
    items: Array<ChargerItem>;
  };
  [ChargerStatusEnum.AVAILABLE]: { count: number; items: Array<ChargerItem> };
  [ChargerStatusEnum.UNAVAILABLE]: { count: number; items: Array<ChargerItem> };
  [ChargerStatusEnum.FAULTED]: { count: number; items: Array<ChargerItem> };
  [ChargerStatusEnum.OFFLINE]: { count: number; items: Array<ChargerItem> };
  [ChargerStatusEnum.ONLINE]: { count: number; items: Array<ChargerItem> };
}

const aggregateOnlineStatusCounts = (
  finalCounts: OnlineStatusCounts,
  stationCounts: OnlineStatusCounts,
): void => {
  Object.values(ChargerStatusEnum).forEach((status) => {
    finalCounts[status].count += stationCounts[status].count;
    stationCounts[status].items.forEach((item) => finalCounts[status].items.push(item));
  });
};

const getNewCounts = (): OnlineStatusCounts => ({
  [ChargerStatusEnum.CHARGING]: { count: 0, items: [] },
  [ChargerStatusEnum.CHARGING_SUSPENDED]: { count: 0, items: [] },
  [ChargerStatusEnum.AVAILABLE]: { count: 0, items: [] },
  [ChargerStatusEnum.UNAVAILABLE]: { count: 0, items: [] },
  [ChargerStatusEnum.FAULTED]: { count: 0, items: [] },
  [ChargerStatusEnum.OFFLINE]: { count: 0, items: [] },
  [ChargerStatusEnum.ONLINE]: { count: 0, items: [] },
});

const getOnlineStatusCountsForStation = (
  chargingStation: ChargingStationDto,
): OnlineStatusCounts => {
  chargingStation = plainToInstance(ChargingStationClass, chargingStation) as ChargingStationDto;
  const counts: OnlineStatusCounts = getNewCounts();

  chargingStation.evses?.forEach((evse: EvseDto) => {
    const latestStatusNotification: LatestStatusNotificationClass = (
      chargingStation as any
    ).latestStatusNotifications?.find(
      (latest: LatestStatusNotificationClass) =>
        latest.statusNotification &&
        (latest.statusNotification.evseId === null ||
          latest.statusNotification.evseId === evse.evseTypeId),
      //   &&
      // latest.statusNotification.connectorId === evse.connectorId,
    );

    // Use type guard to filter for LatestStatusNotificationDto, but do not cast
    // const statusNotifications = (
    //   chargingStation.statusNotifications || []
    // ).filter(sLatestStatusNotificationDto);
    // Find the latest status notification for this EVSE and its first connector
    // const latestStatus = statusNotifications.find(
    //   (status) =>
    //     status &&
    //     (status.evseId === undefined || status.evseId === evse.id) &&
    //     status.connectorId === evse.connectors?.[0]?.id,
    // );

    if (latestStatusNotification) {
      const status = latestStatusNotification.statusNotification!.connectorStatus;

      const chargerStatus = connectorStatusToChargerStatus(status);

      if (chargingStation.isOnline !== true) {
        counts[ChargerStatusEnum.OFFLINE].count++;
        counts[ChargerStatusEnum.OFFLINE].items.push({
          station: chargingStation,
          evse,
          lastStatus: chargerStatus,
        });
      } else {
        counts[chargerStatus].count++;
        counts[chargerStatus].items.push({
          station: chargingStation,
          evse,
          lastStatus: chargerStatus,
        });
      }
    } else {
      if (chargingStation.isOnline !== true) {
        counts[ChargerStatusEnum.OFFLINE].count++;
        counts[ChargerStatusEnum.OFFLINE].items.push({
          station: chargingStation,
          evse,
        });
      } else {
        counts[ChargerStatusEnum.UNAVAILABLE].count++;
        counts[ChargerStatusEnum.UNAVAILABLE].items.push({
          station: chargingStation,
          evse,
        });
      }
    }
  });

  return counts;
};

function connectorStatusToChargerStatus(
  connectorStatus: ConnectorStatusEnumType | string,
): ChargerStatusEnum {
  switch (connectorStatus) {
    case ConnectorStatusEnum.Available:
      return ChargerStatusEnum.AVAILABLE;

    case ConnectorStatusEnum.Preparing:
    case ConnectorStatusEnum.Charging:
    case ConnectorStatusEnum.Finishing:
    case ConnectorStatusEnum.SuspendedEV:
    case ConnectorStatusEnum.SuspendedEVSE:
    case 'Occupied': // To handle possible string enum from different OCPP versions
      // const activeTx = chargingStation.transactions?.find(
      //   (tx: TransactionDto) => tx.evseId === evse.id,
      // );
      // if (activeTx) {
      //   if (activeTx.chargingState === ChargingStateEnumType.Charging) {
      //     return ChargerStatusEnum.CHARGING;
      //   } else {
      //     return ChargerStatusEnum.CHARGING_SUSPENDED;
      //   }
      // }
      return ChargerStatusEnum.CHARGING;

    case ConnectorStatusEnum.Faulted:
      return ChargerStatusEnum.FAULTED;

    case ConnectorStatusEnum.Unavailable:
    default:
      return ChargerStatusEnum.UNAVAILABLE;
  }
}

export const ChargerActivityCard: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<ChargerStatusEnum | null>(null);
  const [selectedItems, setSelectedItems] = useState<Array<ChargerItem>>([]);
  const [stationsSheetOpen, setStationsSheetOpen] = useState(false);
  const translate = useTranslate();

  const {
    query: { data, isLoading, error },
  } = useGqlCustom({
    gqlQuery: GET_CHARGING_STATIONS_WITH_LOCATION_AND_LATEST_STATUS_NOTIFICATIONS_AND_TRANSACTIONS,
  });

  const stations: ChargingStationDto[] = data?.data.ChargingStations || [];

  if (isLoading) return <OverviewCardSkeleton />;

  const finalCounts = getNewCounts();
  stations.forEach((station) => {
    aggregateOnlineStatusCounts(finalCounts, getOnlineStatusCountsForStation(station));
  });

  const total = Object.values(ChargerStatusEnum).reduce(
    (sum, status) => sum + finalCounts[status].count,
    0,
  );

  const handleGaugeClick = (status: ChargerStatusEnum) => {
    setSelectedStatus(status);

    const sortedItemArray = Array.from(finalCounts[status].items).sort((a, b) => {
      if (!a.lastStatus && !b.lastStatus) return 0;
      if (!a.lastStatus) return 1; // undefined goes last
      if (!b.lastStatus) return -1;

      return statusPriority[a.lastStatus] - statusPriority[b.lastStatus];
    });
    setSelectedItems(sortedItemArray);

    setStationsSheetOpen(true);
  };

  const handleClose = () => {
    setSelectedStatus(null);
    setSelectedItems([]);
    setStationsSheetOpen(false);
  };

  return (
    <CanAccess
      resource={ResourceType.CHARGING_STATIONS}
      action={ActionType.LIST}
      fallback={<AccessDeniedFallbackCard />}
    >
      <Card>
        <CardHeader>
          <h2 className={heading2Style}>{translate('Overview.chargerActivity')}</h2>
        </CardHeader>
        <CardContent>
          {error ? (
            <p>{translate('Overview.errorLoadingData')}</p>
          ) : (
            <div className="flex gap-2">
              {[
                ChargerStatusEnum.CHARGING,
                ChargerStatusEnum.AVAILABLE,
                ChargerStatusEnum.UNAVAILABLE,
                ChargerStatusEnum.FAULTED,
                ChargerStatusEnum.OFFLINE,
              ].map((status) => (
                <div
                  key={status}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => handleGaugeClick(status)}
                >
                  <PercentageCircle
                    percentage={
                      total > 0 ? Math.round((finalCounts[status].count / total) * 100) : 0
                    }
                    color={getStatusColor[status]}
                  />
                  <span>{status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {selectedStatus && (
        <ChargerActivityStationsSheet
          open={stationsSheetOpen}
          onOpenAction={handleClose}
          status={selectedStatus}
          chargers={selectedItems}
        />
      )}
    </CanAccess>
  );
};

export const getStatusColor: any = {
  [ChargerStatusEnum.AVAILABLE]: 'text-success',
  [ChargerStatusEnum.UNAVAILABLE]: 'text-warning',
  [ChargerStatusEnum.CHARGING]: 'text-secondary',
  [ChargerStatusEnum.CHARGING_SUSPENDED]: 'text-warning',
  [ChargerStatusEnum.FAULTED]: 'text-muted-foreground',
  [ChargerStatusEnum.ONLINE]: 'text-success',
  [ChargerStatusEnum.OFFLINE]: 'text-destructive',
};
