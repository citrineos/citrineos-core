// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { type ChargingStationDto, ChargingStationProps } from '@citrineos/base';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { Table } from '@lib/client/components/table';
import { Button } from '@lib/client/components/ui/button';
import {
  getChargingStationsColumns,
  getChargingStationsFilters,
} from '@lib/client/pages/charging-stations/columns';
import { ChargingStationClass } from '@lib/cls/charging.station.dto';
import { CHARGING_STATIONS_LIST_QUERY } from '@lib/queries/charging.stations';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { AccessDeniedFallback } from '@lib/utils/AccessDeniedFallback';
import { DEFAULT_SORTERS, EMPTY_FILTER } from '@lib/utils/consts';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { CanAccess, useTranslate } from '@refinedev/core';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import {
  tableHeaderWrapperFlex,
  tableSearchFlex,
  tableWrapperStyle,
} from '@lib/client/styles/table';
import { buttonIconSize } from '@lib/client/styles/icon';
import { DebounceSearch } from '@lib/client/components/debounce-search';
import { useColumnPreferences } from '@lib/client/hooks/useColumnPreferences';
import { useTableFilters } from '@lib/client/hooks/useTableFilters';

export const ChargingStationsList = () => {
  const { push } = useRouter();
  const translate = useTranslate();

  const [searchFilters, setSearchFilters] = useState<any>(EMPTY_FILTER);

  const { renderedVisibleColumns, columnSelector } = useColumnPreferences(
    getChargingStationsColumns(true, translate),
    ResourceType.CHARGING_STATIONS,
  );

  const { filterButton, filterChips, activeCrudFilters } = useTableFilters(
    getChargingStationsColumns(true, translate),
    ResourceType.CHARGING_STATIONS,
  );

  const onSearch = (value: string) => {
    setSearchFilters(value ? getChargingStationsFilters(value) : EMPTY_FILTER);
  };

  return (
    <div className={`${pageMargin} ${tableWrapperStyle}`}>
      <div className={tableHeaderWrapperFlex}>
        <h2 className={heading2Style}>{translate('ChargingStations.ChargingStations')}</h2>
        <div className={tableSearchFlex}>
          <CanAccess resource={ResourceType.CHARGING_STATIONS} action={ActionType.CREATE}>
            <Button variant="success" onClick={() => push(`/${MenuSection.CHARGING_STATIONS}/new`)}>
              <Plus className={buttonIconSize} />
              {translate('buttons.add')} {translate('ChargingStations.chargingStation')}
            </Button>
          </CanAccess>
          <CanAccess resource={ResourceType.CHARGING_STATIONS} action={ActionType.LIST}>
            {columnSelector}
            {filterButton}
            <DebounceSearch
              onSearch={onSearch}
              placeholder={`${translate('placeholders.search')} ${translate('ChargingStations.ChargingStations')}`}
            />
          </CanAccess>
        </div>
      </div>
      {filterChips}
      <CanAccess
        resource={ResourceType.CHARGING_STATIONS}
        action={ActionType.LIST}
        fallback={<AccessDeniedFallback />}
      >
        <Table<ChargingStationDto>
          refineCoreProps={{
            resource: ResourceType.CHARGING_STATIONS,
            sorters: DEFAULT_SORTERS,
            filters: {
              permanent: [...activeCrudFilters, ...searchFilters],
            },
            meta: {
              gqlQuery: CHARGING_STATIONS_LIST_QUERY,
            },
            queryOptions: {
              ...getPlainToInstanceOptions(ChargingStationClass),
              select: (data: any) => {
                return data;
              },
            },
          }}
          enableSorting
          enableFilters
          showHeader
          tableStateKey={ResourceType.CHARGING_STATIONS}
        >
          {renderedVisibleColumns}
        </Table>
      </CanAccess>
    </div>
  );
};
