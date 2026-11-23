// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Metrics configuration, read from the standard OpenTelemetry environment variables.
 *
 * It is read from the environment rather than from `SystemConfig` because the provider has to be
 * registered before `@citrineos/base` is loaded, and loading the config loader loads base.
 */

export const DEFAULT_PROMETHEUS_HOST = 'localhost';
export const DEFAULT_PROMETHEUS_PORT = 9464;
export const PROMETHEUS_ENDPOINT = '/metrics';

export interface MetricsConfig {
  host: string;
  port: number;
  serviceName: string;
  serviceVersion?: string;
}

export interface MetricsDefaults {
  serviceName: string;
  serviceVersion?: string;
}

export type MetricsConfigResult =
  | { enabled: true; config: MetricsConfig; unsupportedExporters: string[] }
  | { enabled: false; unsupportedExporters: string[] };

/**
 * Metrics are off unless `OTEL_METRICS_EXPORTER` names `prometheus`. This departs from the
 * specification, whose default is `otlp`: CitrineOS does not ship an OTLP metrics exporter, and
 * opening a port nobody asked for is not a default we want.
 */
export function readMetricsConfig(
  env: NodeJS.ProcessEnv,
  defaults: MetricsDefaults,
): MetricsConfigResult {
  const exporters = (env.OTEL_METRICS_EXPORTER ?? '')
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name !== '');
  const unsupportedExporters = exporters.filter((name) => name !== 'prometheus' && name !== 'none');

  if (env.OTEL_SDK_DISABLED?.trim().toLowerCase() === 'true' || !exporters.includes('prometheus')) {
    return { enabled: false, unsupportedExporters };
  }

  return {
    enabled: true,
    unsupportedExporters,
    config: {
      host: env.OTEL_EXPORTER_PROMETHEUS_HOST?.trim() || DEFAULT_PROMETHEUS_HOST,
      port: parsePort(env.OTEL_EXPORTER_PROMETHEUS_PORT),
      serviceName: env.OTEL_SERVICE_NAME?.trim() || defaults.serviceName,
      serviceVersion: defaults.serviceVersion,
    },
  };
}

function parsePort(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_PROMETHEUS_PORT;
  }
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `OTEL_EXPORTER_PROMETHEUS_PORT must be an integer from 1 to 65535, got "${raw}"`,
    );
  }
  return port;
}
