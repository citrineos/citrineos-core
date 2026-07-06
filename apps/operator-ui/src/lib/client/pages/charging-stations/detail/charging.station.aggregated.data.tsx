// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import { type MeterValueDto, OCPP2_0_1, type TransactionDto } from '@citrineos/base';
import { RangePicker } from '@lib/client/components/range-picker';
import { LoadingIcon } from '@lib/client/components/ui/loading';
import { MeterValueClass } from '@lib/cls/meter.value.dto';
import { TransactionClass } from '@lib/cls/transaction.dto';
import { GET_METER_VALUES_FOR_STATION } from '@lib/queries/meter.values';
import { GET_TRANSACTION_LIST_FOR_STATION } from '@lib/queries/transactions';
import { ResourceType } from '@lib/utils/access.types';
import { getPlainToInstanceOptions } from '@lib/utils/tables';
import { useList, useTranslate } from '@refinedev/core';
import { endOfDay, isAfter, isBefore, isSameDay, parseISO, startOfDay, subDays } from 'date-fns';
import type { FC } from 'react';
import { useMemo, useState } from 'react';
import { type DateRange } from 'react-day-picker';
import { ChartsWrapper } from '@lib/client/pages/transactions/chart/charts.wrapper';
import { MultiSelect } from '@lib/client/components/multi-select';
import { pageFlex } from '@lib/client/styles/page';

const allContexts = [
  OCPP2_0_1.ReadingContextEnumType.Transaction_Begin,
  OCPP2_0_1.ReadingContextEnumType.Sample_Periodic,
  OCPP2_0_1.ReadingContextEnumType.Transaction_End,
];

const filterByDate = (series: MeterValueDto[], range: DateRange | undefined) => {
  if (!range?.from || !range?.to) return series;

  return series.filter((mv) => {
    const ts = parseISO(mv.timestamp);
    const isAfterOrSameStart = isAfter(ts, range.from!) || isSameDay(ts, range.from!);
    const isBeforeOrSameEnd = isBefore(ts, range.to!) || isSameDay(ts, range.to!);
    return isAfterOrSameStart && isBeforeOrSameEnd;
  });
};

export const AggregatedMeterValuesData: FC<{ id: number }> = ({ id }) => {
  const translate = useTranslate();
  const {
    query: { data: txData, isLoading: txLoading },
  } = useList<TransactionDto>({
    resource: ResourceType.TRANSACTIONS,
    meta: {
      gqlQuery: GET_TRANSACTION_LIST_FOR_STATION,
      gqlVariables: {
        stationId: id,
        limit: 10000,
        offset: 0,
        order_by: { createdAt: 'asc' },
      },
    },
    queryOptions: getPlainToInstanceOptions(TransactionClass),
  });
  const txIds = useMemo(() => txData?.data.map((tx) => tx.id) ?? [], [txData]);

  const {
    query: { data: mvData, isLoading: mvLoading },
  } = useList<MeterValueDto>({
    resource: ResourceType.METER_VALUES,
    meta: {
      gqlQuery: GET_METER_VALUES_FOR_STATION,
      gqlVariables: { transactionDatabaseIds: txIds, limit: 10000, offset: 0 },
    },
    queryOptions: getPlainToInstanceOptions(MeterValueClass),
  });
  const defaultRange: DateRange = {
    from: startOfDay(subDays(new Date(), 7)),
    to: endOfDay(new Date()),
  };

  const [dateRange, setDateRange] = useState(defaultRange);
  const [validContexts, setValidContexts] =
    useState<OCPP2_0_1.ReadingContextEnumType[]>(allContexts);

  if (txLoading || mvLoading)
    return (
      <div className="flex justify-center p-8">
        <LoadingIcon />
      </div>
    );

  const data = filterByDate(mvData?.data ?? [], dateRange);

  return (
    <div className={pageFlex}>
      <div className="grid grid-cols-3 gap-4 w-full">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">
            {translate('ChargingStations.aggregatedData.timeRange')}
          </label>
          <RangePicker dateRange={dateRange} setDateRange={setDateRange} />
        </div>
        <div className="col-span-2 flex flex-col gap-2">
          <label className="text-sm font-semibold">
            {translate('ChargingStations.aggregatedData.contexts')}
          </label>
          <MultiSelect<OCPP2_0_1.ReadingContextEnumType>
            options={Object.values(OCPP2_0_1.ReadingContextEnumType)}
            selectedValues={validContexts}
            setSelectedValues={setValidContexts}
            placeholder={translate('ChargingStations.aggregatedData.selectReadingContexts')}
          />
        </div>
      </div>

      <ChartsWrapper meterValues={data} validContexts={validContexts} />
    </div>
  );
};
