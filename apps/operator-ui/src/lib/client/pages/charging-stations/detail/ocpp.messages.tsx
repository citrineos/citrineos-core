// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { OCPPMessageDto } from '@citrineos/base';
import { MessageOrigin, OCPP_CallAction, OCPPMessageProps } from '@citrineos/base';
import { Button } from '@lib/client/components/ui/button';
import { Label } from '@lib/client/components/ui/label';
import { Switch } from '@lib/client/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lib/client/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@lib/client/components/ui/tooltip';
import { OCPPMessageClass } from '@lib/cls/ocpp.message.dto';
import { GET_OCPP_MESSAGES_LIST_FOR_STATION } from '@lib/queries/ocpp.messages';
import { ResourceType } from '@lib/utils/access.types';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { type LogicalFilter, useInvalidate, useList, useTranslate } from '@refinedev/core';
import { Copy, Download, Link, RefreshCw } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CollapsibleOCPPMessageViewer } from './collapsible.ocpp.message.viewer';
import { buttonIconSize } from '@lib/client/styles/icon';
import { TimestampDisplay } from '@lib/client/components/timestamp-display';
import { Table } from '@lib/client/components/table';
import type { CellContext } from '@tanstack/react-table';
import { copy } from '@lib/utils/copy';
import { DebounceSearch } from '@lib/client/components/debounce-search';
import { MultiSelect } from '@lib/client/components/multi-select';
import { OCPPMessagesExportDialog } from '@lib/client/pages/charging-stations/detail/ocpp.messages.export.dialog';
import { DateTimePicker } from '@lib/client/components/ui/date-time-picker';
import { parseAsJson, useQueryState } from 'nuqs';
import { TableQueryStateSchema } from '@lib/client/components/table/fields/table-query-state';
import { useSelector } from 'react-redux';
import { getPageSizePreference } from '@lib/utils/store/table.preferences.slice';
import { toast } from 'sonner';

export interface OCPPMessagesProps {
  stationId: number;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
}

const actionOptions = [
  ...Array.from(new Set([...Object.values(OCPP_CallAction), ...Object.values(OCPP_CallAction)])),
];

const allOption = 'all';

export const OCPPMessages: React.FC<OCPPMessagesProps> = ({
  stationId,
  initialStartDate = null,
  initialEndDate = null,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate);
  const [searchCid, setSearchCid] = useState<string>('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<string>(allOption);
  const [filters, setFilters] = useState<LogicalFilter[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [liveLogEnabled, setLiveLogEnabled] = useState(false);
  const [sinceTimestamp, setSinceTimestamp] = useState<string | null>(null);

  const translate = useTranslate();
  const liveMode = liveLogEnabled ? 'auto' : 'off';
  const invalidate = useInvalidate();

  const originOptions = useMemo(
    () => [
      { label: translate('ChargingStations.ocppMessages.allOrigins'), value: allOption },
      ...Object.values(MessageOrigin).map((o) => ({
        label: o.toUpperCase(),
        value: o,
      })),
    ],
    [translate],
  );

  const [tableQueryState, _] = useQueryState(
    ResourceType.OCPP_MESSAGES,
    parseAsJson(TableQueryStateSchema.parse),
  );

  const pageSizePreference = useSelector((state) =>
    getPageSizePreference(state, ResourceType.OCPP_MESSAGES),
  );

  const effectiveFilters = useMemo<LogicalFilter[]>(() => {
    if (!sinceTimestamp) return filters;
    return [
      ...filters,
      {
        field: OCPPMessageProps.timestamp,
        operator: 'gt',
        value: sinceTimestamp,
      },
    ];
  }, [filters, sinceTimestamp]);

  const {
    query: { data },
  } = useList<OCPPMessageDto>({
    resource: ResourceType.OCPP_MESSAGES,
    liveMode: 'off',
    pagination: {
      currentPage: tableQueryState?.page ?? 1,
      pageSize: tableQueryState?.size ?? pageSizePreference,
    },
    sorters: [
      {
        field: tableQueryState?.sortBy ?? OCPPMessageProps.timestamp,
        order: tableQueryState?.direction ?? 'desc',
      },
    ],
    meta: {
      gqlQuery: GET_OCPP_MESSAGES_LIST_FOR_STATION,
      gqlVariables: { stationId: stationId },
    },
    filters: effectiveFilters,
    queryOptions: getPlainToInstanceOptions(OCPPMessageClass),
  });

  const messages = useMemo(() => data?.data ?? [], [data?.data]);

  const handleRefresh = () => {
    const latest = messages[0]?.timestamp;
    if (latest) {
      setSinceTimestamp(latest);
    } else {
      invalidate({
        resource: ResourceType.OCPP_MESSAGES,
        invalidates: ['list'],
      });
    }
  };

  useEffect(() => {
    if (!liveLogEnabled) return;

    let timer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(
        () => {
          setLiveLogEnabled(false);
          toast.info(
            translate(
              'ChargingStations.liveLogDisabledInactivity',
              'Live log disabled due to inactivity',
            ),
            { duration: Infinity, position: 'top-right' },
          );
        },
        10 * 60 * 1000,
      );
    };

    const events = ['mousedown', 'keydown', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, resetTimer));
    window.addEventListener('scroll', resetTimer, true);
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      window.removeEventListener('scroll', resetTimer, true);
    };
  }, [liveLogEnabled, translate]);

  useEffect(() => {
    const newFilters: LogicalFilter[] = [];
    if (searchCid.trim()) {
      newFilters.push({
        field: OCPPMessageProps.correlationId,
        operator: 'contains',
        value: searchCid,
      });
    }
    if (startDate) {
      newFilters.push({
        field: OCPPMessageProps.timestamp,
        operator: 'gte',
        value: startDate.toISOString(),
      });
    }
    if (endDate) {
      newFilters.push({
        field: OCPPMessageProps.timestamp,
        operator: 'lte',
        value: endDate.toISOString(),
      });
    }
    if (selectedActions.length > 0) {
      newFilters.push({
        field: OCPPMessageProps.action,
        operator: 'in',
        value: selectedActions,
      });
    }
    if (selectedOrigin && selectedOrigin !== allOption) {
      newFilters.push({
        field: OCPPMessageProps.origin,
        operator: 'eq',
        value: selectedOrigin,
      });
    }

    setFilters(newFilters);
    setSinceTimestamp(null);
  }, [startDate, endDate, searchCid, selectedActions, selectedOrigin]);

  const findRelatedMessages = useCallback(
    (record: OCPPMessageDto) => {
      // Find and select the row with the same correlationId but different origin
      const relatedMessageIndex = messages.findIndex(
        (msg) => msg.correlationId === record.correlationId && msg.origin !== record.origin,
      );
      if (relatedMessageIndex !== -1) {
        // Scroll to the related message
        const element = document.getElementById(`table-row-${relatedMessageIndex}`);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    },
    [messages],
  );

  const getRowClassName = (record: OCPPMessageDto) =>
    record.origin === MessageOrigin.ChargingStation ? 'bg-secondary/25' : 'bg-success/25';

  return (
    <>
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" onClick={() => setExportDialogOpen(true)}>
            <Download className={buttonIconSize} />
            {translate('buttons.exportToCsv')}
          </Button>
          <div className="flex items-center gap-3">
            {!liveLogEnabled && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleRefresh}
                title={translate('ChargingStations.refreshMessages', 'Refresh Messages')}
              >
                <RefreshCw className={buttonIconSize} />
              </Button>
            )}
            <Switch checked={liveLogEnabled} onCheckedChange={setLiveLogEnabled} />
            <Label className="font-medium">{translate('ChargingStations.liveLog')}</Label>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-2 w-full">
          <DebounceSearch
            onSearch={setSearchCid}
            placeholder={translate('ChargingStations.ocppMessages.searchCorrelationId')}
            className="relative w-full"
          />
          <MultiSelect
            options={actionOptions}
            selectedValues={selectedActions}
            setSelectedValues={setSelectedActions}
            placeholder={translate('ChargingStations.ocppMessages.selectActions')}
            searchPlaceholder={translate('ChargingStations.ocppMessages.searchActions')}
          />
          <Select value={selectedOrigin ?? ''} onValueChange={setSelectedOrigin}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={translate('ChargingStations.ocppMessages.filterOrigins')} />
            </SelectTrigger>
            <SelectContent>
              {originOptions.map((opt) => (
                <SelectItem key={opt.label} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateTimePicker
            date={startDate ?? undefined}
            onSelectDateAction={(date) => setStartDate(date ?? null)}
            placeholder={translate('ChargingStations.ocppMessages.pickStartDate')}
          />
          <DateTimePicker
            date={endDate ?? undefined}
            onSelectDateAction={(date) => setEndDate(date ?? null)}
            placeholder={translate('ChargingStations.ocppMessages.pickEndDate')}
          />
        </div>

        <Table<OCPPMessageDto>
          key={liveLogEnabled ? 'ocpp-messages-live' : 'ocpp-messages-static'}
          refineCoreProps={{
            resource: ResourceType.OCPP_MESSAGES,
            liveMode,
            sorters: {
              initial: [{ field: OCPPMessageProps.timestamp, order: 'desc' }],
            },
            filters: {
              permanent: effectiveFilters,
            },
            meta: {
              gqlQuery: GET_OCPP_MESSAGES_LIST_FOR_STATION,
              gqlVariables: { stationId: stationId },
            },
            queryOptions: getPlainToInstanceOptions(OCPPMessageClass),
          }}
          rowClassName={(record) => getRowClassName(record)}
          enableSorting
          enableFilters
          showHeader
          tableStateKey={ResourceType.OCPP_MESSAGES}
        >
          {[
            <Table.Column
              id="correlationId"
              key="correlationId"
              accessorKey="correlationId"
              header={translate('ChargingStations.ocppMessages.correlationId')}
              cell={({ row }: CellContext<OCPPMessageDto, unknown>) => {
                return (
                  <TooltipProvider>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {row.original.correlationId ?? '-'}
                      </code>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              findRelatedMessages(row.original);
                            }}
                          >
                            <Link className={buttonIconSize} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {translate('ChargingStations.ocppMessages.findRelatedMessage')}
                        </TooltipContent>
                      </Tooltip>
                      {row.original.correlationId && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await copy(row.original.correlationId, true, translate);
                              }}
                            >
                              <Copy className={buttonIconSize} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {translate('ChargingStations.ocppMessages.copyCorrelationId')}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                );
              }}
            />,
            <Table.Column
              id="action"
              key="action"
              accessorKey="action"
              header={translate('ChargingStations.ocppMessages.actionOrigin')}
              cell={({ row }: CellContext<OCPPMessageDto, unknown>) => {
                return (
                  <span>
                    {row.original.action ??
                      translate('ChargingStations.ocppMessages.unknownAction')}{' '}
                    - {row.original.origin}
                  </span>
                );
              }}
            />,
            <Table.Column
              id="timestamp"
              key="timestamp"
              accessorKey="timestamp"
              header={translate('ChargingStations.ocppMessages.timestamp')}
              enableSorting
              cell={({ row }: CellContext<OCPPMessageDto, unknown>) => {
                return (
                  <TimestampDisplay
                    isoTimestamp={row.original.timestamp}
                    format="yyyy-MM-dd HH:mm:ss.SSS"
                  />
                );
              }}
            />,
            <Table.Column
              id="message"
              key="message"
              accessorKey="message"
              header={translate('ChargingStations.ocppMessages.content')}
              cell={({ row }: CellContext<OCPPMessageDto, unknown>) => {
                return (
                  <CollapsibleOCPPMessageViewer
                    ocppMessageDto={row.original}
                    unparsed={typeof row.original.message === 'string'}
                  />
                );
              }}
            />,
          ]}
        </Table>
      </div>

      <OCPPMessagesExportDialog
        open={exportDialogOpen}
        onOpenChangeAction={setExportDialogOpen}
        stationId={stationId}
        filters={filters}
      />
    </>
  );
};
