// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { NetworkAlertConfigDto } from '@citrineos/types';
import { NetworkAlertConfigResolver } from '@services/network-alerts/index.js';
import { aSystemConfig } from '@test/providers/system-config.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('NetworkAlertConfigResolver', () => {
  let readByTenant: ReturnType<
    typeof vi.fn<(tenantId: number) => Promise<NetworkAlertConfigDto[]>>
  >;
  let resolver: NetworkAlertConfigResolver;

  beforeEach(() => {
    vi.useFakeTimers();
    readByTenant = vi.fn(async () => []);
    resolver = new NetworkAlertConfigResolver({
      config: aSystemConfig({ networkAlerts: { sweepIntervalSeconds: 30 } }),
      networkAlertConfigRepository: { readByTenant },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the system defaults for a tenant with no rows', async () => {
    const config = await resolver.resolve(1);

    expect(config.StationConnectivity).toEqual({
      enabled: true,
      rules: {
        disconnectSeverity: 'Info',
        frequentDisconnects: { count: 5, windowSeconds: 3600, severity: 'Warning' },
        offlineTooLong: { seconds: 900, severity: 'Critical' },
        missedHeartbeats: 2,
      },
    });
    expect(config.ConnectorStatus.rules.severityByStatus).toEqual({
      Unavailable: 'Warning',
      Faulted: 'Critical',
    });
  });

  it("should lay a tenant's row over the defaults one rule at a time", async () => {
    readByTenant.mockResolvedValue([
      {
        type: 'OcppCallFailures',
        tenantId: 1,
        enabled: false,
        rules: { slowThresholdMs: 2000 },
      },
      { type: 'ConnectorStatus', tenantId: 1, rules: { severityByStatus: { Faulted: 'Warning' } } },
    ]);

    const config = await resolver.resolve(1);

    expect(config.OcppCallFailures).toMatchObject({
      enabled: false,
      rules: { slowThresholdMs: 2000, quietPeriodSeconds: 1800 },
    });
    // A rule is replaced whole: the tenant chose to stop alerting on Unavailable.
    expect(config.ConnectorStatus.rules.severityByStatus).toEqual({ Faulted: 'Warning' });
    expect(config.StationConnectivity.enabled).toBe(true);
  });

  it('should reuse a tenant config for one sweep interval', async () => {
    await resolver.resolve(1);
    await resolver.resolve(1);
    expect(readByTenant).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(30_001);
    await resolver.resolve(1);
    expect(readByTenant).toHaveBeenCalledTimes(2);
  });

  it('should keep tenants apart', async () => {
    await resolver.resolve(1);
    await resolver.resolve(2);

    expect(readByTenant.mock.calls).toEqual([[1], [2]]);
  });

  it('should not cache a failed load', async () => {
    readByTenant.mockRejectedValueOnce(new Error('database down'));

    await expect(resolver.resolve(1)).rejects.toThrow('database down');
    await expect(resolver.resolve(1)).resolves.toBeDefined();
  });
});
