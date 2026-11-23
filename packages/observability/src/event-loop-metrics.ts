// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { monitorEventLoopDelay, performance, type IntervalHistogram } from 'node:perf_hooks';
import type { BatchObservableCallback, MeterProvider } from '@opentelemetry/api';

const METER_NAME = 'citrineos.event-loop';
const RESOLUTION_MS = 10;
const NS_PER_MS = 1e6;

export interface EventLoopMetrics {
  stop(): void;
}

/**
 * Event-loop delay (mean, p50, p95, p99, max) and utilization, each covering the interval since
 * the previous collection. Every gauge is observed from one batch callback because the delay
 * histogram is reset after it is read: separate callbacks would each see a different window.
 */
export function startEventLoopMetrics(meterProvider: MeterProvider): EventLoopMetrics {
  const histogram: IntervalHistogram = monitorEventLoopDelay({ resolution: RESOLUTION_MS });
  histogram.enable();
  let lastUtilization = performance.eventLoopUtilization();

  const meter = meterProvider.getMeter(METER_NAME);
  const delayGauge = (stat: string) =>
    meter.createObservableGauge(`process.runtime.nodejs.event_loop.delay.${stat}`, {
      description: `${stat} event loop delay since the previous collection`,
      unit: 'ms',
    });
  const mean = delayGauge('mean');
  const p50 = delayGauge('p50');
  const p95 = delayGauge('p95');
  const p99 = delayGauge('p99');
  const max = delayGauge('max');
  const utilization = meter.createObservableGauge('process.runtime.nodejs.event_loop.utilization', {
    description: 'Fraction of time the event loop was active since the previous collection (0-1)',
    unit: '1',
  });

  const callback: BatchObservableCallback = (result) => {
    // An empty histogram reports NaN for the mean and a sentinel for min/max.
    if (histogram.count > 0) {
      result.observe(mean, histogram.mean / NS_PER_MS);
      result.observe(p50, histogram.percentile(50) / NS_PER_MS);
      result.observe(p95, histogram.percentile(95) / NS_PER_MS);
      result.observe(p99, histogram.percentile(99) / NS_PER_MS);
      result.observe(max, histogram.max / NS_PER_MS);
    }
    histogram.reset();

    const current = performance.eventLoopUtilization();
    result.observe(
      utilization,
      performance.eventLoopUtilization(current, lastUtilization).utilization,
    );
    lastUtilization = current;
  };
  const observables = [mean, p50, p95, p99, max, utilization];
  meter.addBatchObservableCallback(callback, observables);

  return {
    stop() {
      meter.removeBatchObservableCallback(callback, observables);
      histogram.disable();
    },
  };
}
