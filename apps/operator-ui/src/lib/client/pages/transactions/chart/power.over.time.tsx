// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import type { MeterValueDto } from '@citrineos/base';
import { OCPP2_0_1 } from '@citrineos/base';
import {
  chartMargin,
  chartSize,
  formatTimeLabel,
  generateTimeTicks,
  getXAxisLabelConfig,
  getYAxisLabelConfig,
} from '@lib/client/pages/transactions/chart/util';
import { getTimestampToMeasurandArray } from '@lib/cls/meter.value.dto';
import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { heading3Style } from '@lib/client/styles/page';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@lib/client/components/ui/chart';
import { useTranslate } from '@refinedev/core';

export interface PowerOverTimeProps {
  meterValues: MeterValueDto[];
  validContexts: OCPP2_0_1.ReadingContextEnumType[];
}

export const PowerOverTime = ({ meterValues, validContexts }: PowerOverTimeProps) => {
  const translate = useTranslate();
  const powerAxisLabel = translate('Transactions.charts.powerLabel');

  const chartConfig = {
    elapsedTime: {
      label: translate('Transactions.charts.timeElapsed'),
    },
    kw: {
      label: powerAxisLabel,
    },
  } satisfies ChartConfig;

  const buffer = 1;

  const { chartData, minValue, maxValue } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    const processedData = getTimestampToMeasurandArray(
      meterValues,
      OCPP2_0_1.MeasurandEnumType.Power_Active_Import,
      new Set(validContexts),
    ).map(([elapsedTime, kw]) => {
      const kwFloat = Number(kw);
      if (kwFloat < min) min = Math.floor(kwFloat);
      if (kwFloat > max) max = Math.ceil(kwFloat);
      return { elapsedTime, kw };
    });

    return { chartData: processedData, minValue: min, maxValue: max };
  }, [meterValues, validContexts]);

  return (
    <Card>
      <CardHeader>
        <h3 className={heading3Style}>{translate('Transactions.charts.powerTitle')}</h3>
      </CardHeader>
      <CardContent>
        {!chartData || chartData.length === 0 ? (
          <div>{translate('Transactions.charts.noPowerData')}</div>
        ) : (
          <ChartContainer config={chartConfig} className={chartSize}>
            <LineChart data={chartData} margin={chartMargin}>
              <CartesianGrid />
              <XAxis
                dataKey="elapsedTime"
                type="number"
                ticks={generateTimeTicks(chartData)}
                tickFormatter={formatTimeLabel}
                label={getXAxisLabelConfig(translate('Transactions.charts.timeElapsed'))}
              />
              <YAxis
                domain={[minValue - buffer, maxValue + buffer]}
                label={getYAxisLabelConfig(powerAxisLabel)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                dataKey="kw"
                stroke="var(--color-secondary)"
                dot={{
                  fill: 'var(--color-secondary)',
                }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};
