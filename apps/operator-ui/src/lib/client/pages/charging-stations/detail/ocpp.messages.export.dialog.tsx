// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lib/client/components/ui/dialog';
import { Button } from '@lib/client/components/ui/button';
import { type LogicalFilter, useExport, useTranslate } from '@refinedev/core';
import { type OCPPMessageDto, OCPPMessageProps } from '@citrineos/base';
import { ResourceType } from '@lib/utils/access.types';
import { GET_OCPP_MESSAGES_LIST_FOR_STATION } from '@lib/queries/ocpp.messages';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { dateTimePickerDateFormat } from '@lib/client/components/ui/date-time-picker';
import { formatDate } from '@lib/client/components/timestamp-display';

const createFilterListItem = (label: string, value: string) => (
  <li key={label}>
    <span className="font-semibold">{label}:</span> {value}
  </li>
);

export const OCPPMessagesExportDialog = ({
  open,
  onOpenChangeAction,
  stationId,
  filters,
}: {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  stationId: number;
  filters: LogicalFilter[];
}) => {
  const translate = useTranslate();

  const { triggerExport, isLoading } = useExport<OCPPMessageDto>({
    resource: ResourceType.OCPP_MESSAGES,
    sorters: [{ field: OCPPMessageProps.timestamp, order: 'desc' }],
    meta: {
      gqlQuery: GET_OCPP_MESSAGES_LIST_FOR_STATION,
      gqlVariables: { stationId: stationId },
    },
    filters,
    download: true,
    filename: `ocpp-messages-${stationId}-${Date.now()}`,
    pageSize: 100,
    mapData: (ocppMessage) => {
      return {
        ocppConnectionName: ocppMessage.ocppConnectionName,
        correlationId: ocppMessage.correlationId,
        timestamp: ocppMessage.timestamp,
        origin: ocppMessage.origin,
        protocol: ocppMessage.protocol,
        action: ocppMessage.action,
        message: JSON.stringify(ocppMessage.message),
      };
    },
  });

  const getMessageBasedOnFilters = () => {
    if (filters.length === 0) {
      return translate('ChargingStations.downloadAllMessagesToCsv');
    }

    const messagePrefix = translate('ChargingStations.downloadMessagesToCsvWithFilters');
    const messageItems = [];

    const correlationIdFilter = filters.find((f) => f.field === OCPPMessageProps.correlationId);
    const actionsFilter = filters.find((f) => f.field === OCPPMessageProps.action);
    const originFilter = filters.find((f) => f.field === OCPPMessageProps.origin);
    const startDateFilter = filters.find(
      (f) => f.field === OCPPMessageProps.timestamp && f.operator === 'gte',
    );
    const endDateFilter = filters.find(
      (f) => f.field === OCPPMessageProps.timestamp && f.operator === 'lte',
    );

    if (correlationIdFilter) {
      messageItems.push(
        createFilterListItem(
          translate('ChargingStations.exportDialog.correlationId'),
          correlationIdFilter.value,
        ),
      );
    }
    if (actionsFilter && actionsFilter.value.length > 0) {
      messageItems.push(
        createFilterListItem(
          translate('ChargingStations.exportDialog.actions'),
          actionsFilter.value.join(', '),
        ),
      );
    }
    if (originFilter) {
      messageItems.push(
        createFilterListItem(translate('ChargingStations.exportDialog.origin'), originFilter.value),
      );
    }
    if (startDateFilter) {
      messageItems.push(
        createFilterListItem(
          translate('ChargingStations.exportDialog.startDate'),
          formatDate(startDateFilter.value, dateTimePickerDateFormat),
        ),
      );
    }
    if (endDateFilter) {
      messageItems.push(
        createFilterListItem(
          translate('ChargingStations.exportDialog.endDate'),
          formatDate(endDateFilter.value, dateTimePickerDateFormat),
        ),
      );
    }

    return (
      <div>
        {messagePrefix}
        <ul>{messageItems}</ul>
      </div>
    );
  };

  const exportToCsv = () => {
    triggerExport()
      .then(() => {
        onOpenChangeAction(false);
      })
      .catch((err) => {
        toast.error(translate('ChargingStations.exportToCsvError', { error: JSON.stringify(err) }));
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="w-250" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-1">
            <DialogTitle>{translate('ChargingStations.exportMessagesToCsvHeader')}</DialogTitle>
            {isLoading && <Loader2 className="size-6 animate-spin" />}
          </div>
        </DialogHeader>
        {getMessageBasedOnFilters()}
        <DialogFooter>
          <Button variant="outline" disabled={isLoading} onClick={() => onOpenChangeAction(false)}>
            {translate('buttons.cancel')}
          </Button>
          <Button variant="secondary" disabled={isLoading} onClick={exportToCsv}>
            {translate('buttons.exportToCsv')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
