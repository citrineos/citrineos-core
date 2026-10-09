// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { NetworkAlertOccurrenceProps } from '@citrineos/types';
import { TimestampDisplay } from '@lib/client/components/timestamp-display';
import type { CellContext } from '@tanstack/react-table';
import type { ColumnConfiguration } from '@lib/utils/column-configuration';
import { NetworkAlertOccurrenceClass } from '@lib/cls/network-alert-occurrence-dto';
import { EMPTY_VALUE } from '@lib/utils/consts';
import { NetworkAlertSeverityTag } from '@lib/client/pages/network-alerts/network-alert-tags';
import { formatNetworkAlertDetails } from '@lib/client/pages/network-alerts/network-alert-details';

type TranslateFn = (key: string, options?: any) => string;

export const getNetworkAlertOccurrencesColumns = (
  translate: TranslateFn,
): ColumnConfiguration[] => [
  {
    key: NetworkAlertOccurrenceProps.occurredAt,
    header: translate('NetworkAlerts.occurrences.occurredAt'),
    visible: true,
    sortable: true,
    cellRender: ({ row }: CellContext<NetworkAlertOccurrenceClass, unknown>) =>
      row.original.occurredAt ? (
        <TimestampDisplay isoTimestamp={row.original.occurredAt} />
      ) : (
        <span>{EMPTY_VALUE}</span>
      ),
  },
  {
    key: NetworkAlertOccurrenceProps.severity,
    header: translate('NetworkAlerts.occurrences.severity'),
    visible: true,
    sortable: true,
    cellRender: ({ row }: CellContext<NetworkAlertOccurrenceClass, unknown>) =>
      row.original.severity ? (
        <NetworkAlertSeverityTag severity={row.original.severity} />
      ) : (
        <span>{EMPTY_VALUE}</span>
      ),
  },
  {
    key: NetworkAlertOccurrenceProps.details,
    header: translate('NetworkAlerts.occurrences.details'),
    visible: true,
    cellRender: ({ row }: CellContext<NetworkAlertOccurrenceClass, unknown>) => (
      <span>{formatNetworkAlertDetails(row.original.details)}</span>
    ),
  },
];
