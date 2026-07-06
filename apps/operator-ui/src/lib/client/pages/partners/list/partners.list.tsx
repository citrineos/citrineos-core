// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { Table } from '@lib/client/components/table';
import { Button } from '@lib/client/components/ui/button';
import { getPartnersColumns } from '@lib/client/pages/partners/columns';
import { TenantPartnerClass } from '@lib/cls/tenant.partner.cls';
import { PARTNERS_LIST_QUERY } from '@lib/queries/tenant.partners';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { AccessDeniedFallback } from '@lib/utils/AccessDeniedFallback';
import { DEFAULT_SORTERS } from '@lib/utils/consts';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { CanAccess, useTranslate } from '@refinedev/core';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import {
  tableHeaderWrapperFlex,
  tableSearchFlex,
  tableWrapperStyle,
} from '@lib/client/styles/table';
import { buttonIconSize } from '@lib/client/styles/icon';
import { useColumnPreferences } from '@lib/client/hooks/useColumnPreferences';

export const PartnersList = () => {
  const { push } = useRouter();
  const translate = useTranslate();

  const { renderedVisibleColumns, columnSelector } = useColumnPreferences(
    getPartnersColumns(translate),
    ResourceType.PARTNERS,
  );

  return (
    <div className={`${pageMargin} ${tableWrapperStyle}`}>
      <div className={tableHeaderWrapperFlex}>
        <h2 className={heading2Style}>{translate('TenantPartners.TenantPartners')}</h2>
        <div className={tableSearchFlex}>
          <CanAccess resource={ResourceType.PARTNERS} action={ActionType.CREATE}>
            <Button variant="success" onClick={() => push(`/${MenuSection.PARTNERS}/new`)}>
              <Plus className={buttonIconSize} />
              {translate('buttons.add')} {translate('TenantPartners.TenantPartners')}
            </Button>
          </CanAccess>
          <CanAccess resource={ResourceType.PARTNERS} action={ActionType.LIST}>
            {columnSelector}
          </CanAccess>
        </div>
      </div>
      <CanAccess
        resource={ResourceType.PARTNERS}
        action={ActionType.LIST}
        fallback={<AccessDeniedFallback />}
      >
        <Table
          refineCoreProps={{
            resource: ResourceType.PARTNERS,
            sorters: DEFAULT_SORTERS,
            meta: {
              gqlQuery: PARTNERS_LIST_QUERY,
            },
            queryOptions: {
              ...getPlainToInstanceOptions(TenantPartnerClass),
              select: (data: any) => {
                return data;
              },
            },
          }}
          enableSorting
          enableFilters
          showHeader
          tableStateKey={ResourceType.PARTNERS}
        >
          {renderedVisibleColumns}
        </Table>
      </CanAccess>
    </div>
  );
};
