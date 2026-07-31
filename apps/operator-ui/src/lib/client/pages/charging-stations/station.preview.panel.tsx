// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React, { useState } from 'react';
import { CanAccess, Link, useList, useOne, useTranslate } from '@refinedev/core';
import { useDispatch } from 'react-redux';
import { instanceToPlain } from 'class-transformer';
import type { OCPPMessageDto } from '@citrineos/base';
import { OCPPMessageProps } from '@citrineos/base';
import { ChevronDown, MoreHorizontal, X } from 'lucide-react';
import { Button } from '@lib/client/components/ui/button';
import { KeyValueDisplay } from '@lib/client/components/key-value-display';
import ProtocolTag from '@lib/client/components/protocol-tag';
import { formatDate } from '@lib/client/components/timestamp-display';
import { ChargingStationStatusTag } from '@lib/client/pages/charging-stations/charging.station.status.tag';
import {
  ChargingStationClass,
  type ChargingStationDetailsDto,
} from '@lib/cls/charging.station.dto';
import { OCPPMessageClass } from '@lib/cls/ocpp.message.dto';
import { CHARGING_STATIONS_GET_QUERY } from '@lib/queries/charging.stations';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { DETAIL_TAB_STATE, NOT_APPLICABLE } from '@lib/utils/consts';
import { isEmpty } from '@lib/utils/assertion';
import { openModal } from '@lib/utils/store/modal.slice';
import { ModalComponentType } from '@lib/client/components/modals/modal.types';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { clickableLinkStyle } from '@lib/client/styles/page';
import { Skeleton } from '@lib/client/components/ui/skeleton';

export interface StationPreviewPanelProps {
  /** The ChargingStations.id to preview. */
  stationId: number;
  /** Called when the panel's close button is clicked. */
  onClose: () => void;
}

// Same compact power formatting as connectors/connectors.table.tsx.
const formatPower = (value?: number | null) =>
  value ? (value > 10000 ? `${(value / 1000).toFixed(1)} kW` : `${value} W`) : NOT_APPLICABLE;

/**
 * Persistent, resizable side panel that previews a charging station's key details without leaving
 * the list. Fields only (no edit/delete); keeps "Other Commands" so an operator can fire a quick
 * command. Rendered inside a ResizablePanel — only mounted while a station is selected.
 */
export const StationPreviewPanel: React.FC<StationPreviewPanelProps> = ({ stationId, onClose }) => {
  const translate = useTranslate();
  const dispatch = useDispatch();
  const [showEvses, setShowEvses] = useState(false);

  const {
    query: { data, isLoading },
  } = useOne<ChargingStationDetailsDto>({
    resource: ResourceType.CHARGING_STATIONS,
    id: stationId,
    meta: { gqlQuery: CHARGING_STATIONS_GET_QUERY },
    queryOptions: {
      ...getPlainToInstanceOptions(ChargingStationClass, true),
      enabled: stationId != null,
    },
  });
  const station = data?.data;

  // Latest OCPP message for the station (mirrors the detail card).
  const {
    query: { data: latestLogsData },
  } = useList<OCPPMessageDto>({
    resource: ResourceType.OCPP_MESSAGES,
    meta: { fields: [OCPPMessageProps.id, OCPPMessageProps.timestamp] },
    sorters: [{ field: OCPPMessageProps.timestamp, order: 'desc' }],
    filters: [
      {
        field: OCPPMessageProps.ocppConnectionName,
        operator: 'eq',
        value: station?.ocppConnectionName,
      },
    ],
    pagination: { pageSize: 1, currentPage: 1 },
    liveMode: 'off',
    queryOptions: {
      ...getPlainToInstanceOptions(OCPPMessageClass),
      enabled: !!station?.ocppConnectionName,
    },
  });
  const latestLog = latestLogsData?.data?.[0] || undefined;
  const lastMessageAt = latestLog ? formatDate(latestLog.timestamp) : NOT_APPLICABLE;

  // Security profile of the network profile pushed for the connected server (falls back to the
  // connected ServerNetworkProfile's security profile) — same derivation as the detail card.
  const connectedSecurityProfile =
    station?.setNetworkProfiles?.find(
      (p) => p.websocketServerConfigId === station?.connectedWebsocketServerConfigId,
    )?.securityProfile ?? station?.connectedServerNetworkProfile?.securityProfile;

  const unknownText = translate('Common.unknown');

  const openOtherCommands = () => {
    if (!station) return;
    dispatch(
      openModal({
        title: translate('ChargingStations.otherCommands'),
        modalComponentType: ModalComponentType.otherCommands,
        modalComponentProps: { station: instanceToPlain(station) },
      }),
    );
  };

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          {station ? (
            <Link
              to={`/${MenuSection.CHARGING_STATIONS}/${station.id}`}
              className={`${clickableLinkStyle} truncate`}
            >
              {station.ocppConnectionName}
            </Link>
          ) : (
            <span>{stationId}</span>
          )}
          {station && (
            <span className={station.isOnline ? 'text-success' : 'text-destructive'}>
              {station.isOnline ? translate('Common.online') : translate('Common.offline')}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} title={translate('Common.close')}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading || !station ? (
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-3/5" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            <KeyValueDisplay
              keyLabel={translate('ChargingStations.columns.protocol')}
              value={station.protocol}
              valueRender={(protocol: any) => <ProtocolTag protocol={protocol} />}
            />
            <KeyValueDisplay
              keyLabel={translate('ChargingStations.columns.location')}
              value={station.location?.name}
              valueRender={(name: any) =>
                name ? (
                  <Link to={`/locations/${station.locationId}`} className={clickableLinkStyle}>
                    {name}
                  </Link>
                ) : (
                  <span>{NOT_APPLICABLE}</span>
                )
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
              value={lastMessageAt}
            />
            <KeyValueDisplay
              keyLabel={translate('ChargingStations.columns.vendorModel')}
              value={`${station.chargePointVendor ?? unknownText} / ${station.chargePointModel ?? unknownText}`}
            />
            <KeyValueDisplay
              keyLabel={translate('ChargingStations.columns.firmwareVersion')}
              value={station.firmwareVersion || NOT_APPLICABLE}
            />
            <KeyValueDisplay
              keyLabel={translate('ChargingStations.columns.securityProfile')}
              value={connectedSecurityProfile}
              valueRender={(securityProfile: any) => (
                <span>{securityProfile ?? NOT_APPLICABLE}</span>
              )}
            />
            <KeyValueDisplay
              keyLabel={translate('ChargingStations.columns.serverId')}
              value={station.connectedWebsocketServerConfigId}
              valueRender={(serverId: any) =>
                serverId != null ? (
                  <Link
                    to={`/${MenuSection.CHARGING_STATIONS}/${station.id}?${DETAIL_TAB_STATE}=networkProfiles`}
                    className={clickableLinkStyle}
                  >
                    {serverId}
                  </Link>
                ) : (
                  <span>{NOT_APPLICABLE}</span>
                )
              }
            />

            {/* Collapsible EVSEs & Connectors — operators generally care about this at a glance. */}
            <div className="border-t pt-3">
              <button
                type="button"
                className="flex w-full items-center justify-between text-sm font-medium"
                onClick={() => setShowEvses((s) => !s)}
              >
                <span>
                  {translate('ChargingStations.tabs.evses')} ({station.evses?.length ?? 0})
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showEvses ? 'rotate-180' : ''}`}
                />
              </button>
              {showEvses && (
                <div className="mt-2 flex flex-col gap-2">
                  {isEmpty(station.evses) ? (
                    <span className="text-sm text-muted-foreground">{NOT_APPLICABLE}</span>
                  ) : (
                    station.evses!.map((evse) => (
                      <div key={evse.id} className="rounded-md border p-2 text-sm">
                        <div className="font-medium">#{evse.evseId}</div>
                        {isEmpty(evse.connectors) ? (
                          <div className="mt-1 text-muted-foreground">
                            {translate('ChargingStations.connectors.noConnectors')}
                          </div>
                        ) : (
                          <div className="mt-2 overflow-x-auto rounded-md border">
                            <table className="w-full border-collapse text-xs">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="px-2 py-1 text-left font-medium">
                                    {translate('ChargingStations.connectors.connectorId')}
                                  </th>
                                  <th className="px-2 py-1 text-left font-medium">
                                    {translate('ChargingStations.connectors.type')}
                                  </th>
                                  <th className="px-2 py-1 text-left font-medium">
                                    {translate('Common.status')}
                                  </th>
                                  <th className="px-2 py-1 text-left font-medium">
                                    {translate('ChargingStations.connectors.maxPower')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {evse.connectors!.map((c) => (
                                  <tr key={c.id} className="border-t">
                                    <td className="px-2 py-1">{c.connectorId}</td>
                                    <td className="px-2 py-1">{c.type ?? NOT_APPLICABLE}</td>
                                    <td className="px-2 py-1">{c.status ?? NOT_APPLICABLE}</td>
                                    <td className="px-2 py-1">
                                      {formatPower(c.maximumPowerWatts)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <CanAccess
              resource={ResourceType.CHARGING_STATIONS}
              action={ActionType.COMMAND}
              params={{ id: station.id }}
            >
              <Button
                className="mt-2"
                onClick={openOtherCommands}
                disabled={!station.isOnline}
                title={
                  station.isOnline ? undefined : translate('ChargingStations.commandsUnavailable')
                }
              >
                <MoreHorizontal className="mr-2 h-4 w-4" />
                {translate('ChargingStations.otherCommands')}
              </Button>
            </CanAccess>
          </div>
        )}
      </div>
    </div>
  );
};
