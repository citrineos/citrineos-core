// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { NetworkAlertOccurrenceProps } from '@citrineos/types';
import { Table } from '@lib/client/components/table';
import { NetworkAlertOccurrenceClass } from '@lib/cls/network-alert-occurrence-dto';
import { NETWORK_ALERT_OCCURRENCES_LIST_QUERY } from '@lib/queries/network-alert-occurrences';
import { ResourceType } from '@lib/utils/access-types';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { useColumnPreferences } from '@lib/client/hooks/use-column-preferences';
import { getNetworkAlertOccurrencesColumns } from '@lib/client/pages/network-alerts/detail/network-alert-occurrences/columns';
import { useTranslate } from '@refinedev/core';

interface NetworkAlertOccurrencesListProps {
  alertId: number;
}

export const NetworkAlertOccurrencesList: React.FC<NetworkAlertOccurrencesListProps> = ({
  alertId,
}) => {
  const translate = useTranslate();
  const { renderedVisibleColumns } = useColumnPreferences(
    getNetworkAlertOccurrencesColumns(translate),
    ResourceType.NETWORK_ALERT_OCCURRENCES,
  );

  return (
    <Table
      refineCoreProps={{
        resource: ResourceType.NETWORK_ALERT_OCCURRENCES,
        sorters: {
          initial: [{ field: NetworkAlertOccurrenceProps.occurredAt, order: 'desc' }],
        },
        meta: {
          gqlQuery: NETWORK_ALERT_OCCURRENCES_LIST_QUERY,
        },
        filters: {
          permanent: [
            {
              field: NetworkAlertOccurrenceProps.alertId,
              operator: 'eq',
              value: alertId,
            },
          ],
        },
        queryOptions: getPlainToInstanceOptions(NetworkAlertOccurrenceClass),
      }}
      enableSorting
      enableFilters
      showHeader
      tableStateKey={ResourceType.NETWORK_ALERT_OCCURRENCES}
    >
      {renderedVisibleColumns}
    </Table>
  );
};
