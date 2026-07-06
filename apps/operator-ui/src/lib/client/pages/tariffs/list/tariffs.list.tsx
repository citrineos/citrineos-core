// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { Table } from '@lib/client/components/table';
import { getTariffsColumns, getTariffsFilters } from '@lib/client/pages/tariffs/columns';
import { TariffClass } from '@lib/cls/tariff.dto';
import { TARIFF_LIST_QUERY } from '@lib/queries/tariffs';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { AccessDeniedFallback } from '@lib/utils/AccessDeniedFallback';
import { DEFAULT_SORTERS, EMPTY_FILTER } from '@lib/utils/consts';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { CanAccess, useTranslate } from '@refinedev/core';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import {
  tableHeaderWrapperFlex,
  tableSearchFlex,
  tableWrapperStyle,
} from '@lib/client/styles/table';
import { DebounceSearch } from '@lib/client/components/debounce-search';
import { Button } from '@lib/client/components/ui/button';
import { Plus } from 'lucide-react';
import { buttonIconSize } from '@lib/client/styles/icon';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { useColumnPreferences } from '@lib/client/hooks/useColumnPreferences';

export const TariffsList = () => {
  const { push } = useRouter();
  const [filters, setFilters] = useState<any>(EMPTY_FILTER);
  const translate = useTranslate();

  const { renderedVisibleColumns, columnSelector } = useColumnPreferences(
    getTariffsColumns(translate),
    ResourceType.TARIFFS,
  );

  const onSearch = (value: string) => {
    setFilters(value ? getTariffsFilters(value) : EMPTY_FILTER);
  };

  return (
    <div className={`${pageMargin} ${tableWrapperStyle}`}>
      <div className={tableHeaderWrapperFlex}>
        <h2 className={heading2Style}>{translate('Tariffs.Tariffs')}</h2>
        <div className={tableSearchFlex}>
          <CanAccess resource={ResourceType.TARIFFS} action={ActionType.CREATE}>
            <Button onClick={() => push(`/${MenuSection.TARIFFS}/new`)} variant="success">
              <Plus className={buttonIconSize} />
              {translate('actions.create')} {translate('Tariffs.tariff')}
            </Button>
          </CanAccess>
          <CanAccess resource={ResourceType.TARIFFS} action={ActionType.LIST}>
            {columnSelector}
            <DebounceSearch
              onSearch={onSearch}
              placeholder={`${translate('placeholders.search')} ${translate('Tariffs.Tariffs')}`}
            />
          </CanAccess>
        </div>
      </div>
      <CanAccess
        resource={ResourceType.TARIFFS}
        action={ActionType.LIST}
        fallback={<AccessDeniedFallback />}
      >
        <Table
          refineCoreProps={{
            resource: ResourceType.TARIFFS,
            sorters: DEFAULT_SORTERS,
            filters: {
              permanent: filters,
            },
            meta: {
              gqlQuery: TARIFF_LIST_QUERY,
            },
            queryOptions: {
              ...getPlainToInstanceOptions(TariffClass),
              select: (data: any) => data,
            },
          }}
          enableSorting
          enableFilters
          showHeader
        >
          {renderedVisibleColumns}
        </Table>
      </CanAccess>
    </div>
  );
};
