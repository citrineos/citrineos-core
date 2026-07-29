// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { useCustom, useOne, useTranslate } from '@refinedev/core';
import { useDispatch } from 'react-redux';
import { instanceToPlain } from 'class-transformer';
import { CHARGING_STATION_NETWORK_PROFILES_QUERY } from '@lib/queries/charging.station.network.profiles';
import { CHARGING_STATIONS_GET_QUERY } from '@lib/queries/charging.stations';
import type { ChargingStationDetailsDto } from '@lib/cls/charging.station.dto';
import { ResourceType } from '@lib/utils/access.types';
import { openModal } from '@lib/utils/store/modal.slice';
import { ModalComponentType } from '@lib/client/components/modals/modal.types';
import { Button } from '@lib/client/components/ui/button';
import { NOT_APPLICABLE } from '@lib/utils/consts';
import config from '@lib/utils/config';

interface NetworkProfileRow {
  id: number;
  configurationSlot: number;
  ocppVersion?: string | null;
  ocppTransport?: string | null;
  ocppCsmsUrl?: string | null;
  messageTimeout?: number | null;
  securityProfile?: number | null;
  websocketServerConfigId?: string | null;
  ServerNetworkProfile?: {
    id: string;
    securityProfile?: number | null;
    host?: string | null;
    port?: number | null;
  } | null;
}

/**
 * Network Profiles tab: lists the network profiles configured for a station (its slots), and lets
 * the operator push a new one via the Set Network Profile modal.
 */
export const NetworkProfilesTab: React.FC<{ id: number }> = ({ id }) => {
  const translate = useTranslate();
  const dispatch = useDispatch();

  const {
    query: { data: stationData, isLoading: isStationLoading },
  } = useOne<ChargingStationDetailsDto>({
    resource: ResourceType.CHARGING_STATIONS,
    id,
    meta: { gqlQuery: CHARGING_STATIONS_GET_QUERY },
  });
  const station = stationData?.data;

  const {
    query: { data, isLoading: isProfilesLoading },
  } = useCustom<{
    SetNetworkProfiles: NetworkProfileRow[];
  }>({
    url: config.apiUrl,
    method: 'post',
    meta: {
      gqlQuery: CHARGING_STATION_NETWORK_PROFILES_QUERY,
      gqlVariables: { ocppConnectionName: station?.ocppConnectionName },
    },
    // Only run once we know the station's connection name (avoids sending a null non-nullable var).
    queryOptions: { enabled: !!station?.ocppConnectionName },
  });

  const profiles = data?.data?.SetNetworkProfiles ?? [];

  const openSetModal = () =>
    dispatch(
      openModal({
        title: translate('ChargingStations.commands.setNetworkProfile'),
        modalComponentType: ModalComponentType.setNetworkProfile,
        modalComponentProps: { station: station ? instanceToPlain(station) : undefined },
      }),
    );

  if (isStationLoading || isProfilesLoading) {
    return <p>{translate('Common.loadingEllipsis')}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button disabled={!station || !station.isOnline} onClick={openSetModal}>
          {translate('ChargingStations.commands.setNetworkProfile')}
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead className="bg-muted">
            <tr>
              <th className="px-4 py-2 text-left font-medium">
                {translate('ChargingStations.networkProfiles.slot')}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {translate('ChargingStations.networkProfiles.ocppVersion')}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {translate('ChargingStations.networkProfiles.csmsUrl')}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {translate('ChargingStations.networkProfiles.securityProfile')}
              </th>
              <th className="px-4 py-2 text-left font-medium">
                {translate('ChargingStations.networkProfiles.serverId')}
              </th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {translate('ChargingStations.networkProfiles.empty')}
                </td>
              </tr>
            ) : (
              profiles.map((p: NetworkProfileRow) => (
                <tr key={p.id} className="border-t hover:bg-muted/50">
                  <td className="px-4 py-2">{p.configurationSlot}</td>
                  <td className="px-4 py-2">{p.ocppVersion ?? NOT_APPLICABLE}</td>
                  <td className="px-4 py-2">{p.ocppCsmsUrl ?? NOT_APPLICABLE}</td>
                  <td className="px-4 py-2">{p.securityProfile ?? NOT_APPLICABLE}</td>
                  <td className="px-4 py-2">{p.websocketServerConfigId ?? NOT_APPLICABLE}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
