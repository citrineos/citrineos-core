// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { AuthorizationAttemptProps } from '@citrineos/types';
import { DebounceSearch } from '@lib/client/components/debounce-search';
import { Table } from '@lib/client/components/table';
import { Label } from '@lib/client/components/ui/label';
import { Switch } from '@lib/client/components/ui/switch';
import { useColumnPreferences } from '@lib/client/hooks/use-column-preferences';
import { useTableFilters } from '@lib/client/hooks/use-table-filters';
import {
  getAuthorizationAttemptsColumns,
  getAuthorizationAttemptsFilters,
  unmatchedAttemptsFilter,
} from '@lib/client/pages/authorizations/attempts/columns';
import { heading2Style } from '@lib/client/styles/page';
import { tableHeaderWrapperFlex, tableSearchFlex } from '@lib/client/styles/table';
import { AuthorizationAttemptClass } from '@lib/cls/authorization-attempt-dto';
import {
  AUTHORIZATION_ATTEMPTS_LIST_QUERY,
  GET_AUTHORIZATION_ATTEMPTS_FOR_AUTHORIZATION,
} from '@lib/queries/authorization-attempts';
import { AccessDeniedFallback } from '@lib/utils/access-denied-fallback';
import { ActionType, ResourceType } from '@lib/utils/access-types';
import { EMPTY_FILTER } from '@lib/utils/consts';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { CanAccess, type CrudFilters, useTranslate } from '@refinedev/core';
import { useState } from 'react';

export const AuthorizationAttemptsTable = ({ authorizationId }: { authorizationId?: number }) => {
  const translate = useTranslate();
  const forAuthorization = authorizationId !== undefined;

  const [searchFilters, setSearchFilters] = useState<CrudFilters>(EMPTY_FILTER);
  const [unmatchedOnly, setUnmatchedOnly] = useState(false);

  const columns = getAuthorizationAttemptsColumns(translate, { forAuthorization });
  const { renderedVisibleColumns, columnSelector } = useColumnPreferences(
    columns,
    ResourceType.AUTHORIZATION_ATTEMPTS,
  );
  const { filterButton, filterChips, activeCrudFilters } = useTableFilters(
    columns,
    ResourceType.AUTHORIZATION_ATTEMPTS,
  );

  const onSearch = (value: string) => {
    setSearchFilters(value ? getAuthorizationAttemptsFilters(value) : EMPTY_FILTER);
  };

  return (
    <CanAccess
      resource={ResourceType.AUTHORIZATION_ATTEMPTS}
      action={ActionType.LIST}
      fallback={<AccessDeniedFallback />}
    >
      <div className={tableHeaderWrapperFlex}>
        {forAuthorization ? (
          <span />
        ) : (
          <h2 className={heading2Style}>
            {translate('AuthorizationAttempts.AuthorizationAttempts')}
          </h2>
        )}
        <div className={tableSearchFlex}>
          {!forAuthorization && (
            <div className="flex items-center gap-2">
              <Switch
                id="authorization-attempts-unmatched-only"
                checked={unmatchedOnly}
                onCheckedChange={setUnmatchedOnly}
              />
              <Label htmlFor="authorization-attempts-unmatched-only" className="font-medium">
                {translate('AuthorizationAttempts.unmatchedOnly')}
              </Label>
            </div>
          )}
          {columnSelector}
          {filterButton}
          <DebounceSearch
            onSearch={onSearch}
            placeholder={`${translate('placeholders.search')} ${translate('AuthorizationAttempts.AuthorizationAttempts')}`}
          />
        </div>
      </div>
      {filterChips}
      <Table<AuthorizationAttemptClass>
        refineCoreProps={{
          resource: ResourceType.AUTHORIZATION_ATTEMPTS,
          sorters: {
            initial: [{ field: AuthorizationAttemptProps.timestamp, order: 'desc' }],
          },
          filters: {
            permanent: [
              ...activeCrudFilters,
              ...searchFilters,
              ...(unmatchedOnly ? unmatchedAttemptsFilter : []),
            ],
          },
          meta: forAuthorization
            ? {
                gqlQuery: GET_AUTHORIZATION_ATTEMPTS_FOR_AUTHORIZATION,
                gqlVariables: { id: authorizationId },
              }
            : { gqlQuery: AUTHORIZATION_ATTEMPTS_LIST_QUERY },
          queryOptions: getPlainToInstanceOptions(AuthorizationAttemptClass),
        }}
        enableSorting
        enableFilters
        showHeader
        tableStateKey={ResourceType.AUTHORIZATION_ATTEMPTS}
      >
        {renderedVisibleColumns}
      </Table>
    </CanAccess>
  );
};
