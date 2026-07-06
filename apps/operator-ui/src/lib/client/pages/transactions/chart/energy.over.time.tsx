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
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@lib/client/components/ui/chart';
import { heading3Style } from '@lib/client/styles/page';
import { useTranslate } from '@refinedev/core';

interface EnergyOverTimeProps {
  meterValues: MeterValueDto[];
  validContexts: OCPP2_0_1.ReadingContextEnumType[];
}

export const EnergyOverTime = ({ meterValues, validContexts }: EnergyOverTimeProps) => {
  const translate = useTranslate();
  const energyAxisLabel = translate('Transactions.charts.energyLabel');

  const chartConfig = {
    elapsedTime: {
      label: translate('Transactions.charts.timeElapsed'),
    },
    kWh: {
      label: energyAxisLabel,
    },
  } satisfies ChartConfig;

  const buffer = 1;

  const { chartData, minValue, maxValue } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    const processedData = getTimestampToMeasurandArray(
      meterValues,
      OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Register,
      new Set(validContexts),
    ).map(([elapsedTime, kWh]) => {
      const kWhFloat = Number(kWh);
      if (kWhFloat < min) min = Math.floor(kWhFloat);
      if (kWhFloat > max) max = Math.ceil(kWhFloat);
      return { elapsedTime, kWh };
    });

    return { chartData: processedData, minValue: min, maxValue: max };
  }, [meterValues, validContexts]);

  return (
    <Card>
      <CardHeader>
        <h3 className={heading3Style}>{translate('Transactions.charts.energyTitle')}</h3>
      </CardHeader>
      <CardContent>
        {!chartData || chartData.length === 0 ? (
          <div>{translate('Transactions.charts.noEnergyData')}</div>
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
                label={getYAxisLabelConfig(energyAxisLabel)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                dataKey="kWh"
                stroke="var(--color-success)"
                dot={{
                  fill: 'var(--color-success)',
                }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};
