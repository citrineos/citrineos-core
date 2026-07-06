// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { ChargingStationDto, OCPPMessageDto } from '@citrineos/base';
import { ChargingStationProps, OCPPMessageProps } from '@citrineos/base';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { ModalComponentType } from '@lib/client/components/modals/modal.types';
import ProtocolTag from '@lib/client/components/protocol-tag';
import { formatDate } from '@lib/client/components/timestamp-display';
import { Button } from '@lib/client/components/ui/button';
import { ChargingStationStatusTag } from '@lib/client/pages/charging-stations/charging.station.status.tag';
import {
  ChargingStationClass,
  type ChargingStationDetailsDto,
} from '@lib/cls/charging.station.dto';
import { OCPPMessageClass } from '@lib/cls/ocpp.message.dto';
import type { TransactionClass } from '@lib/cls/transaction.dto';
import {
  CHARGING_STATIONS_DELETE_MUTATION,
  CHARGING_STATIONS_GET_QUERY,
} from '@lib/queries/charging.stations';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { NOT_APPLICABLE } from '@lib/utils/consts';
import { openModal } from '@lib/utils/store/modal.slice';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { CanAccess, Link, useDelete, useList, useOne, useTranslate } from '@refinedev/core';
import { instanceToPlain } from 'class-transformer';
import { ChevronLeft, Edit, Info, MoreHorizontal, RefreshCw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { cardGridStyle, cardHeaderFlex } from '@lib/client/styles/card';
import { badgeListStyle, clickableLinkStyle, heading2Style } from '@lib/client/styles/page';
import { buttonIconSize } from '@lib/client/styles/icon';
import { KeyValueDisplay } from '@lib/client/components/key-value-display';
import { Badge } from '@lib/client/components/ui/badge';
import Image from 'next/image';
import { isGcp } from '@lib/server/clients/file/isGcp';
import { StartTransactionButton } from '@lib/client/pages/charging-stations/start.transaction.button';
import { StopTransactionButton } from '@lib/client/pages/charging-stations/stop.transaction.button';
import { CommandsUnavailableText } from '@lib/client/pages/charging-stations/commands.unavailable.text';
import { ResetButton } from '@lib/client/pages/charging-stations/reset.button';
import { ForceDisconnectButton } from '../force.disconnect.button';
import { Skeleton } from '@lib/client/components/ui/skeleton';
import { NoDataFoundCard } from '@lib/client/components/no-data-found-card';
import { isEmpty } from '@lib/utils/assertion';

export interface ChargingStationDetailCardContentProps {
  id: number;
  transaction?: TransactionClass;
  imageUrl?: string | null;
}

export const ChargingStationDetailCard = ({
  id,
  imageUrl,
}: ChargingStationDetailCardContentProps) => {
  const { mutate } = useDelete();
  const { back, push } = useRouter();
  const dispatch = useDispatch();
  const translate = useTranslate();
  const [showInfoText, setShowInfoText] = useState(false);

  const {
    query: { data, isLoading },
  } = useOne<ChargingStationDetailsDto>({
    resource: ResourceType.CHARGING_STATIONS,
    id,
    meta: {
      gqlQuery: CHARGING_STATIONS_GET_QUERY,
    },
    queryOptions: getPlainToInstanceOptions(ChargingStationClass, true),
  });

  const station = data?.data;

  const {
    query: { data: latestLogsData },
  } = useList<OCPPMessageDto>({
    resource: ResourceType.OCPP_MESSAGES,
    meta: {
      fields: [OCPPMessageProps.id, OCPPMessageProps.timestamp],
    },
    sorters: [{ field: OCPPMessageProps.timestamp, order: 'desc' }],
    filters: [
      {
        field: OCPPMessageProps.ocppConnectionName,
        operator: 'eq',
        value: station?.ocppConnectionName,
      },
    ],
    pagination: {
      pageSize: 1,
      currentPage: 1,
    },
    liveMode: 'off',
    queryOptions: getPlainToInstanceOptions(OCPPMessageClass),
  });

  const latestLog = latestLogsData?.data?.[0] || undefined;

  const handleDeleteClick = useCallback(() => {
    if (!station) return;

    mutate(
      {
        id: station.id!,
        resource: ResourceType.CHARGING_STATIONS,
        meta: {
          gqlMutation: CHARGING_STATIONS_DELETE_MUTATION,
        },
      },
      {
        onSuccess: () => {
          push(`/${MenuSection.CHARGING_STATIONS}`);
        },
      },
    );
  }, [station, mutate, push]);

  const showForceDisconnectModal = useCallback(
    (station: ChargingStationDto) => {
      dispatch(
        openModal({
          title: translate('ChargingStations.forceDisconnect'),
          modalComponentType: ModalComponentType.forceDisconnect,
          modalComponentProps: { station: instanceToPlain(station) },
        }),
      );
    },
    [dispatch, translate],
  );

  const showOtherCommandsModal = useCallback(() => {
    if (!station) return;

    dispatch(
      openModal({
        title: translate('ChargingStations.otherCommands'),
        modalComponentType: ModalComponentType.otherCommands,
        modalComponentProps: { station: instanceToPlain(station) },
      }),
    );
  }, [dispatch, station, translate]);

  const showToggleOnlineModal = useCallback(() => {
    if (!station) return;

    dispatch(
      openModal({
        title: translate('ChargingStations.toggleOnlineStatus'),
        modalComponentType: ModalComponentType.toggleStationOnlineStatus,
        modalComponentProps: {
          id: station.id,
          currentStatus: station.isOnline,
        },
      }),
    );
  }, [dispatch, station, translate]);

  if (isLoading) {
    return <Skeleton className="h-50 w-full" />;
  } else if (!station) {
    return <NoDataFoundCard message={translate('ChargingStations.noDataFound', { id })} />;
  }

  const hasActiveTransactions = station.transactions && station.transactions.length > 0;

  let latestTimestamp = NOT_APPLICABLE;
  if (latestLog) {
    latestTimestamp = formatDate(latestLog.timestamp);
  }

  const unknownText = translate('Common.unknown');

  return (
    <Card>
      <CardHeader>
        <div className={cardHeaderFlex}>
          <ChevronLeft
            onClick={() => {
              if (window.history.state?.idx === 0) {
                push(`/${MenuSection.CHARGING_STATIONS}`);
              } else {
                back();
              }
            }}
            className="cursor-pointer"
          />
          <h2 className={heading2Style}>{station.ocppConnectionName}</h2>
          <span className={station.isOnline ? 'text-success' : 'text-destructive'}>
            {station.isOnline ? translate('Common.online') : translate('Common.offline')}
          </span>
          <CanAccess
            resource={ResourceType.CHARGING_STATIONS}
            action={ActionType.EDIT}
            params={{ id: station.id }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={showToggleOnlineModal}
              title={translate('ChargingStations.toggleOnlineStatus', 'Toggle Online Status')}
            >
              <RefreshCw className={buttonIconSize} />
            </Button>
          </CanAccess>
          <CanAccess
            resource={ResourceType.CHARGING_STATIONS}
            action={ActionType.EDIT}
            params={{ id: station.id }}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => push(`/${MenuSection.CHARGING_STATIONS}/${station.id}/edit`)}
            >
              <Edit className={buttonIconSize} />
              {translate('buttons.edit')}
            </Button>
          </CanAccess>
          <CanAccess
            resource={ResourceType.CHARGING_STATIONS}
            action={ActionType.DELETE}
            params={{ id: station.id }}
          >
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteClick}
              disabled={!!latestLog}
              title={
                latestLog ? 'Cannot delete a station that has OCPP message history' : undefined
              }
            >
              <Trash2 className={buttonIconSize} />
              {translate('buttons.delete')}
            </Button>
          </CanAccess>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: KeyValue details */}
          <div className="flex-1">
            <div className={cardGridStyle}>
              <KeyValueDisplay
                keyLabel={translate('ChargingStations.columns.protocol')}
                value={station[ChargingStationProps.protocol]}
                valueRender={(protocol: any) => <ProtocolTag protocol={protocol} />}
              />
              <KeyValueDisplay
                keyLabel={translate('ChargingStations.columns.location')}
                value={station?.location?.name}
                valueRender={(locationName: any) =>
                  locationName ? (
                    <Link
                      to={`/locations/${station.locationId}`}
                      className={clickableLinkStyle}
                      title={locationName}
                    >
                      {locationName}
                    </Link>
                  ) : (
                    <span>{NOT_APPLICABLE}</span>
                  )
                }
              />
              <KeyValueDisplay
                keyLabel={translate('ChargingStations.upsert.latitude')}
                value={
                  station.coordinates
                    ? station.coordinates.coordinates[1].toFixed(4)
                    : station.location?.coordinates
                      ? station.location.coordinates.coordinates[1].toFixed(4)
                      : NOT_APPLICABLE
                }
              />

              <KeyValueDisplay
                keyLabel={translate('ChargingStations.upsert.longitude')}
                value={
                  station.coordinates
                    ? station.coordinates.coordinates[0].toFixed(4)
                    : station.location?.coordinates
                      ? station.location.coordinates.coordinates[0].toFixed(4)
                      : NOT_APPLICABLE
                }
              />

              <KeyValueDisplay
                keyLabel={translate('Common.status')}
                value={''}
                valueRender={() =>
                  (station.evses?.length ?? 0) > 0 ? (
                    <ChargingStationStatusTag station={station} />
                  ) : (
                    <span>{NOT_APPLICABLE}</span>
                  )
                }
              />

              <KeyValueDisplay
                keyLabel={translate('ChargingStations.detailCard.lastOcppMessage')}
                value={latestTimestamp}
              />

              <KeyValueDisplay
                keyLabel={translate('ChargingStations.columns.vendorModel')}
                value={`${station.chargePointVendor ?? unknownText} / ${station.chargePointModel ?? unknownText}`}
              />

              <KeyValueDisplay
                keyLabel={translate('ChargingStations.columns.floorLevel')}
                value={station.floorLevel || NOT_APPLICABLE}
              />

              <KeyValueDisplay
                keyLabel={translate('ChargingStations.columns.parkingRestrictions')}
                value={station.parkingRestrictions}
                valueRender={(parkingRestrictions) => (
                  <div className={badgeListStyle}>
                    {parkingRestrictions?.length > 0 ? (
                      parkingRestrictions.map((pr: any) => (
                        <Badge key={pr} variant="muted">
                          {pr}
                        </Badge>
                      ))
                    ) : (
                      <span>{NOT_APPLICABLE}</span>
                    )}
                  </div>
                )}
              />

              <KeyValueDisplay
                keyLabel={translate('ChargingStations.columns.capabilities')}
                value={station.capabilities}
                valueRender={(capabilities) => (
                  <div className={badgeListStyle}>
                    {capabilities?.length > 0 ? (
                      capabilities.map((cap: any) => (
                        <Badge key={cap} variant="muted">
                          {cap}
                        </Badge>
                      ))
                    ) : (
                      <span>{NOT_APPLICABLE}</span>
                    )}
                  </div>
                )}
              />

              <KeyValueDisplay
                keyLabel={translate('ChargingStations.columns.firmwareVersion')}
                value={station.firmwareVersion}
              />

              <KeyValueDisplay
                keyLabel={
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <span>OCPP 1.6 StatusNotification Handling</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowInfoText(!showInfoText)}
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                    </div>
                    {showInfoText && (
                      <div className="text-xs text-muted-foreground">
                        {translate('ChargingStations.use16StatusNotification0')}
                      </div>
                    )}
                  </div>
                }
                value={
                  station.use16StatusNotification0
                    ? translate('Common.enabled')
                    : translate('Common.disabled')
                }
              />

              <KeyValueDisplay
                keyLabel={translate('ChargingStations.detailCard.connectorTypes')}
                value={
                  isEmpty(station.connectors)
                    ? NOT_APPLICABLE
                    : station
                        .connectors!.map((c) => c.type)
                        .filter(Boolean)
                        .join(', ')
                }
              />

              <KeyValueDisplay
                keyLabel={translate('ChargingStations.detailCard.totalEvses')}
                value={station.evses?.length ?? 0}
              />
            </div>
          </div>

          {/* Right: Image */}
          {imageUrl && (
            <div className="flex-shrink-0 w-64 md:w-48 sm:w-32 h-64 md:h-48 sm:h-32 flex items-center justify-center bg-gray-100 rounded-md relative">
              <Image
                src={imageUrl}
                unoptimized={isGcp}
                fill={isGcp}
                alt={`${station.ocppConnectionName} image`}
                className="w-full h-full object-contain rounded-md bg-gray-100"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Command Buttons */}
        <div className="mt-6">
          <CanAccess
            resource={ResourceType.CHARGING_STATIONS}
            action={ActionType.COMMAND}
            params={{ id: station.id }}
          >
            <div className="flex flex-col gap-2">
              {!station.isOnline && <CommandsUnavailableText />}
              <div className="flex gap-4 flex-wrap">
                <ForceDisconnectButton
                  id={station.id}
                  onClickAction={() => showForceDisconnectModal(station)}
                />
                {!hasActiveTransactions && (
                  <StartTransactionButton station={station} disabled={!station.isOnline} />
                )}
                {hasActiveTransactions && (
                  <StopTransactionButton station={station} disabled={!station.isOnline} />
                )}
                <ResetButton station={station} disabled={!station.isOnline} />
                <Button onClick={showOtherCommandsModal} disabled={!station.isOnline}>
                  <MoreHorizontal className={buttonIconSize} />
                  {translate('ChargingStations.otherCommands')}
                </Button>
              </div>
            </div>
          </CanAccess>
        </div>
      </CardContent>
    </Card>
  );
};
