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
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@lib/client/components/ui/chart';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { heading3Style } from '@lib/client/styles/page';
import { useTranslate } from '@refinedev/core';

interface StateOfChargeProps {
  meterValues: MeterValueDto[];
  validContexts: OCPP2_0_1.ReadingContextEnumType[];
}

export const StateOfCharge = ({ meterValues, validContexts }: StateOfChargeProps) => {
  const translate = useTranslate();
  const socAxisLabel = translate('Transactions.charts.stateOfChargeLabel');

  const chartConfig = {
    elapsedTime: {
      label: translate('Transactions.charts.timeElapsed'),
    },
    stateOfCharge: {
      label: socAxisLabel,
    },
  } satisfies ChartConfig;

  const chartData = useMemo(() => {
    const rawData = getTimestampToMeasurandArray(
      meterValues,
      OCPP2_0_1.MeasurandEnumType.SoC,
      new Set(validContexts),
    ).map(([elapsedTime, value]) => {
      const num = parseFloat(value);
      return {
        elapsedTime,
        stateOfCharge: (num <= 1 ? num * 100 : num).toFixed(2),
      };
    });

    return rawData;
  }, [meterValues, validContexts]);

  return (
    <Card>
      <CardHeader>
        <h3 className={heading3Style}>{translate('Transactions.charts.stateOfChargeTitle')}</h3>
      </CardHeader>
      <CardContent>
        {!chartData || chartData.length === 0 ? (
          <div>{translate('Transactions.charts.noStateOfChargeData')}</div>
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
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                label={getYAxisLabelConfig(socAxisLabel)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                dataKey="stateOfCharge"
                stroke="var(--color-warning)"
                dot={{
                  fill: 'var(--color-warning)',
                }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};
