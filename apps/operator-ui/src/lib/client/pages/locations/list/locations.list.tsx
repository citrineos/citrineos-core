// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { LocationDto } from '@citrineos/base';
import { DebounceSearch } from '@lib/client/components/debounce-search';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { Table } from '@lib/client/components/table';
import { Button } from '@lib/client/components/ui/button';
import { getLocationFilters, getLocationsColumns } from '@lib/client/pages/locations/columns';
import { LocationsChargingStationsTable } from '@lib/client/pages/locations/list/locations.charging.stations.table';
import { LocationClass } from '@lib/cls/location.dto';
import { LOCATIONS_LIST_QUERY } from '@lib/queries/locations';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { AccessDeniedFallback } from '@lib/utils/AccessDeniedFallback';
import { DEFAULT_SORTERS } from '@lib/utils/consts';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { CanAccess, useTranslate } from '@refinedev/core';
import type { ExpandedState } from '@tanstack/react-table';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { buttonIconSize } from '@lib/client/styles/icon';
import {
  tableHeaderWrapperFlex,
  tableSearchFlex,
  tableWrapperStyle,
} from '@lib/client/styles/table';
import { useColumnPreferences } from '@lib/client/hooks/useColumnPreferences';

export const LocationsList = () => {
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [searchValue, setSearchValue] = useState<string>('');
  const { push } = useRouter();
  const translate = useTranslate();

  const { renderedVisibleColumns, columnSelector } = useColumnPreferences(
    getLocationsColumns(translate),
    ResourceType.LOCATIONS,
  );

  const onSearch = (value: string) => {
    setSearchValue(value);

    if (!value) {
      setExpanded({});
    }
  };

  return (
    <div className={`${pageMargin} ${tableWrapperStyle}`}>
      <div className={tableHeaderWrapperFlex}>
        <h2 className={heading2Style}>{translate('Locations.Locations')}</h2>
        <div className={tableSearchFlex}>
          <CanAccess resource={ResourceType.LOCATIONS} action={ActionType.CREATE}>
            <Button variant="success" onClick={() => push(`/${MenuSection.LOCATIONS}/new`)}>
              <Plus className={buttonIconSize} />
              {translate('buttons.add')} {translate('Locations.location')}
            </Button>
          </CanAccess>
          <CanAccess resource={ResourceType.LOCATIONS} action={ActionType.LIST}>
            {columnSelector}
            <DebounceSearch
              onSearch={onSearch}
              placeholder={`${translate('placeholders.search')} ${translate('Locations.Locations')}`}
            />
          </CanAccess>
        </div>
      </div>
      <CanAccess
        resource={ResourceType.LOCATIONS}
        action={ActionType.LIST}
        fallback={<AccessDeniedFallback />}
      >
        <Table<LocationDto>
          refineCoreProps={{
            resource: ResourceType.LOCATIONS,
            sorters: DEFAULT_SORTERS,
            meta: {
              gqlQuery: LOCATIONS_LIST_QUERY,
              gqlVariables: getLocationFilters(searchValue),
            },
            queryOptions: {
              ...getPlainToInstanceOptions(LocationClass),
            },
          }}
          expandable={{
            expandedRowKeys: expanded,
            onExpandedRowsChange: (updaterOrValue) => {
              const newExpanded =
                typeof updaterOrValue === 'function' ? updaterOrValue(expanded) : updaterOrValue;
              setExpanded(newExpanded);
            },
            expandedRowRender: (record: LocationDto) => (
              <div className="border-t bg-muted/20 p-4">
                <LocationsChargingStationsTable location={record} />
              </div>
            ),
            expandedRowClassName: 'bg-muted/10',
          }}
          enableSorting
          tableStateKey={ResourceType.LOCATIONS}
        >
          {renderedVisibleColumns}
        </Table>
      </CanAccess>
    </div>
  );
};
