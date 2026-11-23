// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  AggregationTemporality,
  InMemoryMetricExporter,
  MeterProvider,
  type MetricData,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { afterEach, describe, expect, it } from 'vitest';
import { startEventLoopMetrics, type EventLoopMetrics } from '../index.js';

function setup() {
  const exporter = new InMemoryMetricExporter(AggregationTemporality.CUMULATIVE);
  const reader = new PeriodicExportingMetricReader({ exporter, exportIntervalMillis: 60_000 });
  const provider = new MeterProvider({ readers: [reader] });
  return { reader, provider };
}

async function collect(reader: PeriodicExportingMetricReader): Promise<Map<string, number>> {
  const { resourceMetrics } = await reader.collect();
  const values = new Map<string, number>();
  for (const scope of resourceMetrics.scopeMetrics) {
    for (const metric of scope.metrics as MetricData[]) {
      const point = metric.dataPoints[0];
      if (point && typeof point.value === 'number') {
        values.set(metric.descriptor.name, point.value);
      }
    }
  }
  return values;
}

const busyWait = (ms: number) => {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // block the event loop
  }
};

describe('startEventLoopMetrics', () => {
  let handle: EventLoopMetrics | undefined;
  let provider: MeterProvider | undefined;

  afterEach(async () => {
    handle?.stop();
    await provider?.shutdown();
    handle = undefined;
    provider = undefined;
  });

  it('reports delay and utilization gauges', async () => {
    const env = setup();
    provider = env.provider;
    handle = startEventLoopMetrics(env.provider);

    await new Promise((resolve) => setTimeout(resolve, 50));
    const values = await collect(env.reader);

    for (const stat of ['mean', 'p50', 'p95', 'p99', 'max']) {
      expect(values.get(`process.runtime.nodejs.event_loop.delay.${stat}`)).toBeGreaterThan(0);
    }
    const utilization = values.get('process.runtime.nodejs.event_loop.utilization');
    expect(utilization).toBeGreaterThanOrEqual(0);
    expect(utilization).toBeLessThanOrEqual(1);
  });

  it('covers only the interval since the previous collection', async () => {
    const env = setup();
    provider = env.provider;
    handle = startEventLoopMetrics(env.provider);

    // A long block lands in the first window; a reset histogram must not carry it into the next.
    await new Promise((resolve) => setTimeout(resolve, 20));
    busyWait(300);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const first = await collect(env.reader);
    expect(first.get('process.runtime.nodejs.event_loop.delay.max')).toBeGreaterThan(200);

    await new Promise((resolve) => setTimeout(resolve, 100));
    const second = await collect(env.reader);
    expect(second.get('process.runtime.nodejs.event_loop.delay.max')).toBeLessThan(200);
  });
});
