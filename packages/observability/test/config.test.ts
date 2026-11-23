// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { DEFAULT_PROMETHEUS_HOST, DEFAULT_PROMETHEUS_PORT, readMetricsConfig } from '../index.js';

const defaults = { serviceName: 'test-service' };

describe('readMetricsConfig', () => {
  it('is disabled when OTEL_METRICS_EXPORTER is unset', () => {
    expect(readMetricsConfig({}, defaults)).toEqual({ enabled: false, unsupportedExporters: [] });
  });

  it('is disabled for none', () => {
    expect(readMetricsConfig({ OTEL_METRICS_EXPORTER: 'none' }, defaults).enabled).toBe(false);
  });

  it('reports unsupported exporters and stays disabled when prometheus is not named', () => {
    expect(readMetricsConfig({ OTEL_METRICS_EXPORTER: 'otlp' }, defaults)).toEqual({
      enabled: false,
      unsupportedExporters: ['otlp'],
    });
  });

  it('enables with defaults when prometheus is named', () => {
    expect(readMetricsConfig({ OTEL_METRICS_EXPORTER: 'prometheus' }, defaults)).toEqual({
      enabled: true,
      unsupportedExporters: [],
      config: {
        host: DEFAULT_PROMETHEUS_HOST,
        port: DEFAULT_PROMETHEUS_PORT,
        serviceName: 'test-service',
        serviceVersion: undefined,
      },
    });
  });

  it('accepts a comma-separated, mixed-case list and reports the unsupported entries', () => {
    const result = readMetricsConfig({ OTEL_METRICS_EXPORTER: ' OTLP , Prometheus ' }, defaults);
    expect(result.enabled).toBe(true);
    expect(result.unsupportedExporters).toEqual(['otlp']);
  });

  it('honours host, port and service name overrides', () => {
    const result = readMetricsConfig(
      {
        OTEL_METRICS_EXPORTER: 'prometheus',
        OTEL_EXPORTER_PROMETHEUS_HOST: '0.0.0.0',
        OTEL_EXPORTER_PROMETHEUS_PORT: '9100',
        OTEL_SERVICE_NAME: 'csms-eu',
      },
      defaults,
    );
    expect(result).toMatchObject({
      enabled: true,
      config: { host: '0.0.0.0', port: 9100, serviceName: 'csms-eu' },
    });
  });

  it('is disabled when OTEL_SDK_DISABLED is true, even with prometheus named', () => {
    expect(
      readMetricsConfig(
        { OTEL_METRICS_EXPORTER: 'prometheus', OTEL_SDK_DISABLED: 'TRUE' },
        defaults,
      ).enabled,
    ).toBe(false);
  });

  it.each(['0', '65536', '94.64', 'abc'])('rejects port %s', (port) => {
    expect(() =>
      readMetricsConfig(
        { OTEL_METRICS_EXPORTER: 'prometheus', OTEL_EXPORTER_PROMETHEUS_PORT: port },
        defaults,
      ),
    ).toThrow(/OTEL_EXPORTER_PROMETHEUS_PORT/);
  });
});
