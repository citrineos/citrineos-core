// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { INetworkAlertConfigRepository } from '@citrineos/dal';
import type {
  NetworkAlertConfigDto,
  NetworkAlertRules,
  NetworkAlertType,
  SystemConfig,
} from '@citrineos/types';

export type ResolvedNetworkAlertConfig = {
  [T in NetworkAlertType]: { enabled: boolean; rules: NetworkAlertRules<T> };
};

function rowFor<T extends NetworkAlertType>(
  rows: NetworkAlertConfigDto[],
  type: T,
): Extract<NetworkAlertConfigDto, { type: T }> | undefined {
  return rows.find((row): row is Extract<NetworkAlertConfigDto, { type: T }> => row.type === type);
}

/**
 * A tenant's alert configuration: its NetworkAlertConfigs rows laid over the system defaults.
 *
 * Each tenant's result is reused for one sweep interval, so a change made in the UI reaches the
 * event handlers on every instance within that interval.
 */
export class NetworkAlertConfigResolver {
  private readonly _defaults: SystemConfig['networkAlerts']['defaults'];
  private readonly _ttlMs: number;
  private readonly _repository: INetworkAlertConfigRepository;
  private readonly _cache = new Map<
    number,
    { expiresAt: number; config: Promise<ResolvedNetworkAlertConfig> }
  >();

  constructor({
    config,
    networkAlertConfigRepository,
  }: {
    config: SystemConfig;
    networkAlertConfigRepository: INetworkAlertConfigRepository;
  }) {
    this._defaults = config.networkAlerts.defaults;
    this._ttlMs = config.networkAlerts.sweepIntervalSeconds * 1000;
    this._repository = networkAlertConfigRepository;
  }

  resolve(tenantId: number): Promise<ResolvedNetworkAlertConfig> {
    const cached = this._cache.get(tenantId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.config;
    }
    const config = this._load(tenantId);
    this._cache.set(tenantId, { expiresAt: Date.now() + this._ttlMs, config });
    config.catch(() => this._cache.delete(tenantId));
    return config;
  }

  private async _load(tenantId: number): Promise<ResolvedNetworkAlertConfig> {
    const rows = await this._repository.readByTenant(tenantId);
    const connectivity = rowFor(rows, 'StationConnectivity');
    const connectorStatus = rowFor(rows, 'ConnectorStatus');
    const callFailures = rowFor(rows, 'OcppCallFailures');
    const defaults = this._defaults;

    return {
      StationConnectivity: {
        enabled: connectivity?.enabled ?? defaults.StationConnectivity.enabled,
        rules: { ...defaults.StationConnectivity.rules, ...(connectivity?.rules ?? {}) },
      },
      ConnectorStatus: {
        enabled: connectorStatus?.enabled ?? defaults.ConnectorStatus.enabled,
        rules: { ...defaults.ConnectorStatus.rules, ...(connectorStatus?.rules ?? {}) },
      },
      OcppCallFailures: {
        enabled: callFailures?.enabled ?? defaults.OcppCallFailures.enabled,
        rules: { ...defaults.OcppCallFailures.rules, ...(callFailures?.rules ?? {}) },
      },
    };
  }
}
