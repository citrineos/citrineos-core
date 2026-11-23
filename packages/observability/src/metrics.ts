// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { metrics } from '@opentelemetry/api';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { MeterProvider } from '@opentelemetry/sdk-metrics';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { type ILogObj, Logger } from 'tslog';
import {
  type MetricsConfig,
  type MetricsDefaults,
  PROMETHEUS_ENDPOINT,
  readMetricsConfig,
} from './config.js';
import { type EventLoopMetrics, startEventLoopMetrics } from './event-loop-metrics.js';

let meterProvider: MeterProvider | undefined;
let eventLoopMetrics: EventLoopMetrics | undefined;

/**
 * Registers the global MeterProvider and serves it on a Prometheus endpoint.
 *
 * The OpenTelemetry metrics API has no proxy provider: a meter obtained before this runs is a
 * no-op for the life of the process. CitrineOS packages create their instruments when their
 * modules load, so this must run before any `@citrineos/*` package other than this one is
 * imported. Calls after the first are ignored.
 */
export function initMetrics(config: MetricsConfig, logger: Logger<ILogObj>): void {
  if (meterProvider) {
    return;
  }

  const exporter = new PrometheusExporter(
    { host: config.host, port: config.port, endpoint: PROMETHEUS_ENDPOINT },
    (error) => {
      if (error) {
        logger.error(
          `Prometheus metrics endpoint failed to start on ${config.host}:${config.port}`,
          error,
        );
      } else {
        logger.info(
          `Prometheus metrics exposed on http://${config.host}:${config.port}${PROMETHEUS_ENDPOINT}`,
        );
      }
    },
  );

  meterProvider = new MeterProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: config.serviceName,
      ...(config.serviceVersion ? { [ATTR_SERVICE_VERSION]: config.serviceVersion } : {}),
    }),
    readers: [exporter],
  });
  metrics.setGlobalMeterProvider(meterProvider);
  eventLoopMetrics = startEventLoopMetrics(meterProvider);
}

/**
 * Reads the configuration from `env` and, when metrics are enabled, initializes them. Throws on a
 * configuration that enables metrics but cannot be honoured, so a typo fails startup instead of
 * silently turning metrics off.
 */
export function initMetricsFromEnv(
  defaults: MetricsDefaults,
  env: NodeJS.ProcessEnv = process.env,
): void {
  const logger = new Logger<ILogObj>({
    name: 'Observability',
    type: env.DEPLOYMENT_TARGET === 'cloud' ? 'json' : 'pretty',
  });
  const result = readMetricsConfig(env, defaults);
  if (result.unsupportedExporters.length > 0) {
    logger.warn(
      `OTEL_METRICS_EXPORTER names unsupported exporter(s) ${result.unsupportedExporters.join(', ')}; only "prometheus" is supported`,
    );
  }
  if (result.enabled) {
    initMetrics(result.config, logger);
  }
}

/** Stops the event-loop gauges and closes the Prometheus endpoint so the process can exit. */
export async function shutdownMetrics(): Promise<void> {
  if (!meterProvider) {
    return;
  }
  eventLoopMetrics?.stop();
  eventLoopMetrics = undefined;
  await meterProvider.shutdown();
  metrics.disable();
  meterProvider = undefined;
}
