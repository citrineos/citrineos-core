// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export {
  DEFAULT_PROMETHEUS_HOST,
  DEFAULT_PROMETHEUS_PORT,
  PROMETHEUS_ENDPOINT,
  readMetricsConfig,
} from './src/config.js';
export type { MetricsConfig, MetricsConfigResult, MetricsDefaults } from './src/config.js';
export { startEventLoopMetrics } from './src/event-loop-metrics.js';
export type { EventLoopMetrics } from './src/event-loop-metrics.js';
export { initMetrics, initMetricsFromEnv, shutdownMetrics } from './src/metrics.js';
