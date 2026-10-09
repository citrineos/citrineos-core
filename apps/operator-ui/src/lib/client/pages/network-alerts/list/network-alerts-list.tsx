// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Table } from '@lib/client/components/table';
import {
  getNetworkAlertsColumns,
  getNetworkAlertsFilters,
} from '@lib/client/pages/network-alerts/columns';
import { NetworkAlertClass } from '@lib/cls/network-alert-dto';
import { NETWORK_ALERTS_LIST_QUERY } from '@lib/queries/network-alerts';
import { ActionType, ResourceType } from '@lib/utils/access-types';
import { AccessDeniedFallback } from '@lib/utils/access-denied-fallback';
import { DEFAULT_SORTERS, EMPTY_FILTER } from '@lib/utils/consts';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { CanAccess, useTranslate } from '@refinedev/core';
import { useState } from 'react';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import {
  tableHeaderWrapperFlex,
  tableSearchFlex,
  tableWrapperStyle,
} from '@lib/client/styles/table';
import { DebounceSearch } from '@lib/client/components/debounce-search';
import { useColumnPreferences } from '@lib/client/hooks/use-column-preferences';
import { useTableFilters } from '@lib/client/hooks/use-table-filters';

export const NetworkAlertsList = () => {
  const translate = useTranslate();

  const [searchFilters, setSearchFilters] = useState<any>(EMPTY_FILTER);

  const { renderedVisibleColumns, columnSelector } = useColumnPreferences(
    getNetworkAlertsColumns(translate),
    ResourceType.NETWORK_ALERTS,
  );

  const { filterButton, filterChips, activeCrudFilters } = useTableFilters(
    getNetworkAlertsColumns(translate),
    ResourceType.NETWORK_ALERTS,
  );

  const onSearch = (value: string) => {
    setSearchFilters(value ? getNetworkAlertsFilters(value) : EMPTY_FILTER);
  };

  return (
    <div className={`${pageMargin} ${tableWrapperStyle}`}>
      <div className={tableHeaderWrapperFlex}>
        <h2 className={heading2Style}>{translate('NetworkAlerts.NetworkAlerts')}</h2>
        <div className={tableSearchFlex}>
          <CanAccess resource={ResourceType.NETWORK_ALERTS} action={ActionType.LIST}>
            {columnSelector}
            {filterButton}
            <DebounceSearch
              onSearch={onSearch}
              placeholder={`${translate('placeholders.search')} ${translate('NetworkAlerts.NetworkAlerts')}`}
            />
          </CanAccess>
        </div>
      </div>
      {filterChips}
      <CanAccess
        resource={ResourceType.NETWORK_ALERTS}
        action={ActionType.LIST}
        fallback={<AccessDeniedFallback />}
      >
        <Table<NetworkAlertClass>
          refineCoreProps={{
            resource: ResourceType.NETWORK_ALERTS,
            sorters: DEFAULT_SORTERS,
            filters: {
              permanent: [...activeCrudFilters, ...searchFilters],
            },
            meta: {
              gqlQuery: NETWORK_ALERTS_LIST_QUERY,
            },
            queryOptions: {
              ...getPlainToInstanceOptions(NetworkAlertClass),
              select: (data: any) => {
                return data;
              },
            },
          }}
          enableSorting
          enableFilters
          showHeader
          tableStateKey={ResourceType.NETWORK_ALERTS}
        >
          {renderedVisibleColumns}
        </Table>
      </CanAccess>
    </div>
  );
};
