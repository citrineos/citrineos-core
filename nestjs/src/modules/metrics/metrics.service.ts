// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Injectable } from '@nestjs/common';

/**
 * Prometheus exposition format primitives. Hand-rolled rather than
 * pulling `prom-client` as a dependency — keeps the metrics surface
 * tiny and ops-focused (counters + gauges, no histograms or summaries
 * yet). Adding histograms is straightforward when latency tracking
 * lands.
 *
 * Mirrors the legacy `metricsService` shape so dashboards can stay
 * pointed at the same metric names.
 */

type Labels = Record<string, string>;
type MetricKind = 'counter' | 'gauge';

interface MetricDescriptor {
  name: string;
  help: string;
  kind: MetricKind;
}

/** Encodes a label set into a stable string key for the per-series map. */
const labelsKey = (labels: Labels = {}): string => {
  const keys = Object.keys(labels).sort();
  if (keys.length === 0) return '';
  return keys.map((k) => `${k}="${labels[k]}"`).join(',');
};

/** Renders a label set in Prometheus format: `{key="value",…}`. */
const renderLabels = (labels: Labels = {}): string => {
  const keys = Object.keys(labels).sort();
  if (keys.length === 0) return '';
  return `{${keys.map((k) => `${k}="${escapeLabel(labels[k])}"`).join(',')}}`;
};

const escapeLabel = (v: string): string =>
  v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');

/**
 * In-process Prometheus registry. `inc()` for monotonic counters,
 * `set()` for gauges; `render()` formats the entire registry as
 * Prometheus exposition text and is called by `MetricsController`
 * when an external scraper hits `GET /metrics`.
 *
 * Hand-rolled rather than pulling `prom-client` so the dependency
 * footprint stays tiny. Histogram support can land alongside latency
 * tracking when needed.
 */
@Injectable()
export class MetricsService {
  private readonly descriptors = new Map<string, MetricDescriptor>();
  private readonly series = new Map<string, Map<string, number>>();

  /**
   * Increment a counter (monotonic). Counters reset only on process restart.
   */
  inc(name: string, labels: Labels = {}, by: number = 1, help: string = ''): void {
    this.touch(name, 'counter', help);
    const seriesMap = this.seriesMap(name);
    const key = labelsKey(labels);
    seriesMap.set(key, (seriesMap.get(key) ?? 0) + by);
  }

  /**
   * Set a gauge to the absolute value. Use for things that can go up
   * and down (e.g. active connections, in-flight requests).
   */
  set(name: string, value: number, labels: Labels = {}, help: string = ''): void {
    this.touch(name, 'gauge', help);
    this.seriesMap(name).set(labelsKey(labels), value);
  }

  /** Render the full registry as Prometheus exposition text. */
  render(): string {
    const out: string[] = [];
    const sortedNames = [...this.descriptors.keys()].sort();
    for (const name of sortedNames) {
      const desc = this.descriptors.get(name)!;
      if (desc.help) out.push(`# HELP ${name} ${desc.help}`);
      out.push(`# TYPE ${name} ${desc.kind}`);
      const seriesMap = this.series.get(name);
      if (!seriesMap || seriesMap.size === 0) {
        out.push(`${name} 0`);
        continue;
      }
      for (const [labelKey, value] of [...seriesMap.entries()].sort()) {
        const labels = parseLabelKey(labelKey);
        out.push(`${name}${renderLabels(labels)} ${value}`);
      }
    }
    return out.join('\n') + '\n';
  }

  private touch(name: string, kind: MetricKind, help: string): void {
    if (!this.descriptors.has(name)) {
      this.descriptors.set(name, { name, help, kind });
    } else if (help && !this.descriptors.get(name)!.help) {
      this.descriptors.get(name)!.help = help;
    }
  }

  private seriesMap(name: string): Map<string, number> {
    let m = this.series.get(name);
    if (!m) {
      m = new Map();
      this.series.set(name, m);
    }
    return m;
  }
}

/** Parse a `key="value",…` string back into a Labels object. */
const parseLabelKey = (key: string): Labels => {
  if (!key) return {};
  const out: Labels = {};
  // Lightweight parser — expects the format produced by `labelsKey`.
  const re = /([a-zA-Z_][a-zA-Z0-9_]*)="([^"]*)"/g;
  for (const match of key.matchAll(re)) out[match[1]] = match[2];
  return out;
};
