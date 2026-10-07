// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { childLogger, type IRoleProvider } from '@citrineos/base';
import type { RoleDefinitions, SystemConfig } from '@citrineos/types';
import type { ILogObj, Logger } from 'tslog';

interface PolicyStoreDependencies {
  config: SystemConfig;
  roleProvider: IRoleProvider;
  permissionCatalog: Set<string>;
  logger?: Logger<ILogObj>;
}

export class PolicyStore {
  private readonly _roleProvider: IRoleProvider;
  private readonly _refreshIntervalMs: number;
  private readonly _common: string[];
  private readonly _catalog: Set<string>;
  private readonly _enforcing: boolean;
  private readonly _logger: Logger<ILogObj>;

  private _roles: RoleDefinitions = {};
  private _loaded = false;
  private _timer?: NodeJS.Timeout;
  private _inFlight?: Promise<void>;
  private _warnedRoles = new Set<string>();

  constructor({ config, roleProvider, permissionCatalog, logger }: PolicyStoreDependencies) {
    this._roleProvider = roleProvider;
    this._refreshIntervalMs = config.roles.refreshIntervalSeconds * 1000;
    this._common = config.roles.common;
    this._catalog = permissionCatalog;
    this._enforcing = config.auth.mode !== 'localBypass';
    this._logger = childLogger(logger, this.constructor.name);
  }

  async start(): Promise<void> {
    await this.refresh();

    if (!this._loaded && this._enforcing) {
      throw new Error('Initial policy load failed; refusing to start while enforcing');
    }

    this._timer = setInterval(() => {
      void this.refresh();
    }, this._refreshIntervalMs);
    this._timer.unref?.();
  }

  shutdown(): void {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = undefined;
    }
  }

  // Coalesces callers onto one load. Without this a provider slower than the refresh interval
  // overlaps itself, and an older read can land after a newer one and win.
  async refresh(): Promise<void> {
    if (this._inFlight) {
      return this._inFlight;
    }

    this._inFlight = this._load();
    try {
      await this._inFlight;
    } finally {
      this._inFlight = undefined;
    }
  }

  private async _load(): Promise<void> {
    try {
      const roles = await this._roleProvider.listRoles();
      this._roles = roles;
      this._loaded = true;
      this._warnedRoles.clear();
      this._warnUnknownPermissions(roles);
      this._logger.debug(`Policy refreshed: ${Object.keys(roles).length} roles`);
    } catch (error) {
      this._logger.error(
        this._loaded
          ? 'Policy refresh failed, keeping the last known good policy'
          : 'Initial policy load failed, no policy is in effect',
        error,
      );
    }
  }

  private _warnUnknownRoles(roles: string[]): void {
    for (const role of roles) {
      if (this._roles[role] === undefined && !this._warnedRoles.has(role)) {
        this._warnedRoles.add(role);
        this._logger.warn(
          `Token carries role '${role}', which the seed does not define, so it grants nothing`,
        );
      }
    }
  }

  private _warnUnknownPermissions(roles: RoleDefinitions): void {
    const unknown = Object.entries(roles).flatMap(([role, definition]) =>
      definition.permissions
        .filter((permission) => !this._catalog.has(permission))
        .map((permission) => `${role}: ${permission}`),
    );

    if (unknown.length > 0) {
      this._logger.warn(
        `Role seed grants permissions this build does not expose, they have no effect: ${unknown.join(', ')}`,
      );
    }
  }

  roleNames(): string[] {
    return Object.keys(this._roles).sort();
  }

  hasPermission(roles: string[], permission: string): boolean {
    this._warnUnknownRoles(roles);
    if (this._common.includes(permission)) {
      return true;
    }
    return roles.some((role) => this._roles[role]?.permissions.includes(permission) === true);
  }

  permissionsFor(roles: string[]): { resources: Record<string, string[]>; permissions: string[] } {
    this._warnUnknownRoles(roles);
    const resources: Record<string, Set<string>> = {};
    const permissions = new Set<string>(this._common);

    for (const role of roles) {
      const definition = this._roles[role];
      if (!definition) {
        continue;
      }
      for (const permission of definition.permissions) {
        permissions.add(permission);
      }
      for (const [resource, actions] of Object.entries(definition.resources)) {
        resources[resource] ??= new Set<string>();
        for (const action of actions) {
          resources[resource].add(action);
        }
      }
    }

    return {
      resources: Object.fromEntries(
        Object.entries(resources).map(([resource, actions]) => [resource, [...actions].sort()]),
      ),
      permissions: [...permissions].sort(),
    };
  }
}
