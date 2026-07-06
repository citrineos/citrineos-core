// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { Table } from '@lib/client/components/table';
import { AuthorizationClass } from '@lib/cls/authorization.dto';
import { AUTHORIZATIONS_LIST_QUERY } from '@lib/queries/authorizations';
import { ResourceType } from '@lib/utils/access.types';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { useColumnPreferences } from '@lib/client/hooks/useColumnPreferences';
import { getAuthorizationsColumns } from '@lib/client/pages/authorizations/columns';
import { useTranslate } from '@refinedev/core';

interface PartnerAuthorizationsProps {
  partnerId: number;
}

export const PartnerAuthorizations: React.FC<PartnerAuthorizationsProps> = ({ partnerId }) => {
  const translate = useTranslate();
  const { renderedVisibleColumns } = useColumnPreferences(
    getAuthorizationsColumns(translate),
    ResourceType.AUTHORIZATIONS,
  );

  return (
    <Table
      refineCoreProps={{
        resource: ResourceType.AUTHORIZATIONS,
        meta: {
          gqlQuery: AUTHORIZATIONS_LIST_QUERY,
        },
        filters: {
          permanent: [
            {
              field: 'tenantPartnerId',
              operator: 'eq',
              value: partnerId,
            },
          ],
        },
        queryOptions: getPlainToInstanceOptions(AuthorizationClass),
      }}
      enableSorting
      enableFilters
      showHeader
    >
      {renderedVisibleColumns}
    </Table>
  );
};
