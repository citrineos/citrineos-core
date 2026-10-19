// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { MenuSection } from '@lib/client/components/main-menu/main-menu';
import { Table } from '@lib/client/components/table';
import { Button } from '@lib/client/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@lib/client/components/ui/tabs';
import { AuthorizationAttemptsTable } from '@lib/client/pages/authorizations/attempts/authorization-attempts-table';
import {
  getAuthorizationsColumns,
  getAuthorizationFilters,
} from '@lib/client/pages/authorizations/columns';
import { AuthorizationClass } from '@lib/cls/authorization-dto';
import { AUTHORIZATIONS_LIST_QUERY } from '@lib/queries/authorizations';
import { ActionType, ResourceType } from '@lib/utils/access-types';
import { AccessDeniedFallback } from '@lib/utils/access-denied-fallback';
import { DETAIL_TAB_STATE, EMPTY_FILTER } from '@lib/utils/consts';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { CanAccess, useTranslate } from '@refinedev/core';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import {
  tableHeaderWrapperFlex,
  tableSearchFlex,
  tableWrapperStyle,
} from '@lib/client/styles/table';
import { buttonIconSize } from '@lib/client/styles/icon';
import { type AuthorizationDto, AuthorizationProps } from '@citrineos/types';
import { DebounceSearch } from '@lib/client/components/debounce-search';
import { useColumnPreferences } from '@lib/client/hooks/use-column-preferences';
import { cardTabsStyle } from '@lib/client/styles/card';

enum AuthorizationsListTabType {
  authorizations = 'authorizations',
  attempts = 'attempts',
}

export const AuthorizationsList = () => {
  const translate = useTranslate();
  const [tab, setTab] = useQueryState(DETAIL_TAB_STATE);

  return (
    <div className={`${pageMargin} ${tableWrapperStyle}`}>
      <Tabs
        value={
          tab && tab in AuthorizationsListTabType ? tab : AuthorizationsListTabType.authorizations
        }
        onValueChange={(selectedTab: string) => setTab(selectedTab)}
      >
        <TabsList>
          <TabsTrigger value={AuthorizationsListTabType.authorizations}>
            {translate('Authorizations.Authorizations')}
          </TabsTrigger>
          <TabsTrigger value={AuthorizationsListTabType.attempts}>
            {translate('AuthorizationAttempts.AuthorizationAttempts')}
          </TabsTrigger>
        </TabsList>
        <TabsContent value={AuthorizationsListTabType.authorizations} className={cardTabsStyle}>
          <AuthorizationsTable />
        </TabsContent>
        <TabsContent value={AuthorizationsListTabType.attempts} className={cardTabsStyle}>
          <AuthorizationAttemptsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AuthorizationsTable = () => {
  const { push } = useRouter();
  const [filters, setFilters] = useState<any>(EMPTY_FILTER);
  const translate = useTranslate();

  const { renderedVisibleColumns, columnSelector } = useColumnPreferences(
    getAuthorizationsColumns(translate),
    ResourceType.AUTHORIZATIONS,
  );

  const onSearch = (value: string) => {
    setFilters(value ? getAuthorizationFilters(value) : EMPTY_FILTER);
  };

  return (
    <>
      <div className={tableHeaderWrapperFlex}>
        <h2 className={heading2Style}>{translate('Authorizations.Authorizations')}</h2>
        <div className={tableSearchFlex}>
          <CanAccess resource={ResourceType.AUTHORIZATIONS} action={ActionType.CREATE}>
            <Button variant="success" onClick={() => push(`/${MenuSection.AUTHORIZATIONS}/new`)}>
              <Plus className={buttonIconSize} />
              {translate('buttons.add')} {translate('Authorizations.authorization')}
            </Button>
          </CanAccess>
          <CanAccess resource={ResourceType.AUTHORIZATIONS} action={ActionType.LIST}>
            {columnSelector}
            <DebounceSearch
              onSearch={onSearch}
              placeholder={`${translate('placeholders.search')} ${translate('Authorizations.authorization')}`}
            />
          </CanAccess>
        </div>
      </div>
      <CanAccess
        resource={ResourceType.AUTHORIZATIONS}
        action={ActionType.LIST}
        fallback={<AccessDeniedFallback />}
      >
        <Table<AuthorizationDto>
          refineCoreProps={{
            resource: ResourceType.AUTHORIZATIONS,
            sorters: {
              initial: [{ field: AuthorizationProps.idToken, order: 'asc' }],
            },
            filters: {
              permanent: filters,
            },
            meta: {
              gqlQuery: AUTHORIZATIONS_LIST_QUERY,
            },
            queryOptions: {
              ...getPlainToInstanceOptions(AuthorizationClass),
              select: (data: any) => {
                return data;
              },
            },
          }}
          enableSorting
          enableFilters
          showHeader
          tableStateKey={ResourceType.AUTHORIZATIONS}
        >
          {renderedVisibleColumns}
        </Table>
      </CanAccess>
    </>
  );
};
