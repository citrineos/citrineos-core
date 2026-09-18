// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { ChargingStationDto } from '@citrineos/types';
import { ChargingStationProps } from '@citrineos/types';
import { useTenantId } from '@lib/client/hooks/use-tenant-id';
import { ResourceType } from '@lib/utils/access-types';
import { useList } from '@refinedev/core';

export interface ChargingStationIdResult {
  id: number | undefined;
  isLoading: boolean;
  isNotFound: boolean;
}

export const useChargingStationId = (
  ocppConnectionName: string | undefined,
): ChargingStationIdResult => {
  const tenantId = useTenantId();

  const {
    query: { data, isLoading, isFetched },
  } = useList<ChargingStationDto>({
    resource: ResourceType.CHARGING_STATIONS,
    meta: { fields: [ChargingStationProps.id] },
    filters: [
      {
        field: ChargingStationProps.ocppConnectionName,
        operator: 'eq',
        value: ocppConnectionName,
      },
      {
        field: ChargingStationProps.tenantId,
        operator: 'eq',
        value: tenantId,
      },
    ],
    pagination: { pageSize: 1, currentPage: 1 },
    liveMode: 'off',
    queryOptions: { enabled: !!ocppConnectionName },
  });

  const id = data?.data?.[0]?.id;

  return {
    id,
    isLoading: !!ocppConnectionName && isLoading,
    isNotFound: !!ocppConnectionName && isFetched && id == null,
  };
};
