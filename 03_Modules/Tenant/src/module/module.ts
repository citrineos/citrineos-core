// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  BootstrapConfig,
  CallAction,
  ICache,
  IMessageHandler,
  IMessageSender,
  SystemConfig,
} from '@citrineos/base';
import { AbstractModule, EventGroup, BadRequestError, DEFAULT_TENANT_ID } from '@citrineos/base';
import { RabbitMqReceiver, RabbitMqSender } from '@citrineos/util';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { type ITenantRepository, SequelizeTenantRepository, Tenant } from '@citrineos/data';

/**
 * Type-safe tenant events
 */
export interface TenantEvents {
  TenantCreated: (tenant: Tenant, tenantPath?: string, websocketServerId?: string) => void;
  TenantDeleted: (tenantId: number) => void;
}

export class TenantModule extends AbstractModule {
  /**
   * Fields
   */
  _requests: CallAction[] = [];
  _responses: CallAction[] = [];
  private _listeners: Partial<{ [K in keyof TenantEvents]: TenantEvents[K][] }> = {};

  protected _tenantRepository: ITenantRepository;

  /**
   * Constructor
   */

  /**
   * This is the constructor function that initializes the {@link TenantModule}.
   *
   * @param {BootstrapConfig & SystemConfig} config - The `config` contains configuration settings for the module.
   *
   * @param {ICache} [cache] - The cache instance which is shared among the modules & Central System to pass information such as blacklisted actions or boot status.
   *
   * @param {IMessageSender} [sender] - The `sender` parameter is an optional parameter that represents an instance of the {@link IMessageSender} interface.
   * It is used to send messages from the central system to external systems or devices. If no `sender` is provided, a default {@link RabbitMqSender} instance is created and used.
   *
   * @param {IMessageHandler} [handler] - The `handler` parameter is an optional parameter that represents an instance of the {@link IMessageHandler} interface.
   * It is used to handle incoming messages and dispatch them to the appropriate methods or functions. If no `handler` is provided, a default {@link RabbitMqReceiver} instance is created and used.
   *
   * @param {Logger<ILogObj>} [logger] - The `logger` parameter is an optional parameter that represents an instance of {@link Logger<ILogObj>}.
   * It is used to propagate system wide logger settings and will serve as the parent logger for any sub-component logging. If no `logger` is provided, a default {@link Logger<ILogObj>} instance is created and used.
   *
   * @param {ITenantRepository} [tenantRepository] - An optional parameter of type {@link ITenantRepository}
   * which represents a repository for tenant data.
   * If no `tenantRepository` is provided, a default {@link sequelize:tenantRepository} instance is created and used.
   */
  constructor(
    config: BootstrapConfig & SystemConfig,
    cache: ICache,
    sender?: IMessageSender,
    handler?: IMessageHandler,
    logger?: Logger<ILogObj>,
    tenantRepository?: ITenantRepository,
  ) {
    super(
      config,
      cache,
      handler || new RabbitMqReceiver(config, logger),
      sender || new RabbitMqSender(config, logger),
      EventGroup.Tenant,
      logger,
    );
    this._requests = config.modules.tenant.requests;
    this._responses = config.modules.tenant.responses;

    this._tenantRepository = tenantRepository || new SequelizeTenantRepository(config, logger);
  }

  get tenantRepository(): ITenantRepository {
    return this._tenantRepository;
  }

  /**
   * Event system
   */
  on<K extends keyof TenantEvents>(event: K, listener: TenantEvents[K]) {
    this._listeners[event] ??= [];
    this._listeners[event]!.push(listener);
  }

  private _emit<K extends keyof TenantEvents>(event: K, ...args: Parameters<TenantEvents[K]>) {
    this._listeners[event]?.forEach((listener) => (listener as any)(...args));
  }

  /**
   * Creates a tenant and adds a mapping to a websocket server if provided
   */
  async createTenant(
    tenant: Tenant,
    tenantPath?: string,
    websocketServerId?: string,
  ): Promise<Tenant> {
    let effectivePath = tenantPath;

    // Slugification if no path provided and dynamic resolution is enabled
    if (!effectivePath && tenant.name) {
      const hasDynamicEnabled = this._config.util.networkConnection.websocketServers.some(
        (ws) => ws.dynamicTenantResolution,
      );

      if (hasDynamicEnabled) {
        effectivePath = this._slugify(tenant.name);
        this._logger?.info(
          `No tenant path provided; generated slug '${effectivePath}' from name '${tenant.name}'`,
        );
      }
    }

    if (effectivePath) {
      const serverIds = websocketServerId
        ? [websocketServerId]
        : this._config.util.networkConnection.websocketServers
            .filter((ws) => ws.dynamicTenantResolution)
            .map((ws) => ws.id)
            .filter((id): id is string => !!id);

      const baseUrl = this._getOcppRouterBaseUrl();

      for (const id of serverIds) {
        const routerUrl = `${baseUrl}/data/ocpprouter/websocket?id=${id}`;
        try {
          const response = await fetch(routerUrl, {
            headers: this._getSystemHeaders(),
          });
          if (response.ok) {
            const config = (await response.json()) as any;
            if (config.tenantPathMapping && config.tenantPathMapping[effectivePath]) {
              throw new BadRequestError(
                `Tenant path '${effectivePath}' is already taken on server '${id}'`,
              );
            }
          }
        } catch (error) {
          if (error instanceof BadRequestError) {
            throw error;
          }
          this._logger?.warn(
            `Could not verify path availability on server ${id}: ${
              error instanceof Error ? error.message : error
            }`,
          );
        }
      }
    }
    const createdTenant = await this._tenantRepository.createTenant(tenant);

    // Register Mapping
    if (effectivePath) {
      const serverIds = websocketServerId
        ? [websocketServerId]
        : this._config.util.networkConnection.websocketServers
            .filter((ws) => ws.dynamicTenantResolution)
            .map((ws) => ws.id)
            .filter((id): id is string => !!id);

      const baseUrl = this._getOcppRouterBaseUrl();

      for (const id of serverIds) {
        const routerUrl = `${baseUrl}/data/ocpprouter/websocketMapping?id=${id}`;
        try {
          const response = await fetch(routerUrl, {
            method: 'PUT',
            headers: this._getSystemHeaders(),
            body: JSON.stringify({
              path: effectivePath,
              tenantId: createdTenant.id,
            }),
          });

          if (!response.ok) {
            const errorBody = await response.text();
            this._logger?.error(
              `Failed to add websocket mapping on server ${id}: ${response.status} ${errorBody}`,
            );
          } else {
            this._logger?.info(
              `Successfully added websocket mapping for tenant ${createdTenant.id} to path ${effectivePath} on server ${id}`,
            );
          }
        } catch (error) {
          this._logger?.error(`Error calling OcppRouter API at ${routerUrl}:`, error);
        }
      }
    }

    this._logger?.info(`Tenant created: ${createdTenant.id} — emitting TenantCreated event`);

    this._emit('TenantCreated', createdTenant, effectivePath, websocketServerId);

    return createdTenant;
  }

  /**
   * Deletes a tenant and removes all associated mappings from websocket servers
   */
  async deleteTenant(id: number): Promise<Tenant | undefined> {
    // Resolve websocket servers to clean up
    const serverIds = this._config.util.networkConnection.websocketServers
      .map((ws) => ws.id)
      .filter((id): id is string => !!id);

    const baseUrl = this._getOcppRouterBaseUrl();

    // Perform cleanup on all servers
    for (const serverId of serverIds) {
      const routerUrl = `${baseUrl}/data/ocpprouter/websocketMapping?id=${serverId}&tenantId=${id}`;
      try {
        const response = await fetch(routerUrl, {
          method: 'DELETE',
          headers: this._getSystemHeaders(),
        });

        if (!response.ok) {
          this._logger?.error(
            `Failed to cleanup websocket mapping for tenant ${id} on server ${serverId}: ${response.status}`,
          );
        } else {
          this._logger?.info(
            `Cleaned up websocket mappings for tenant ${id} on server ${serverId}`,
          );
        }
      } catch (error) {
        this._logger?.error(`Error cleaning up mapping at ${routerUrl}:`, error);
      }
    }

    // Delete from repository
    const deletedTenant = await this._tenantRepository.deleteByKey(
      DEFAULT_TENANT_ID,
      id.toString(),
    ); // DEFAULT_TENANT_ID for global tenant table

    if (deletedTenant) {
      this._logger?.info(`Tenant deleted: ${id} — emitting TenantDeleted event`);
      this._emit('TenantDeleted', id);
    }

    return deletedTenant;
  }

  /**
   * Helper to resolve the OcppRouter Base URL
   */
  private _getOcppRouterBaseUrl(): string {
    return (
      (this._config.modules.tenant as any).ocppRouterBaseUrl ||
      `http://${this._config.centralSystem.host}:${this._config.centralSystem.port}`
    );
  }

  /**
   * Helper to get system headers for internal communication
   */
  private _getSystemHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this._config.centralSystem.systemApiToken) {
      headers['x-system-token'] = this._config.centralSystem.systemApiToken;
    }

    return headers;
  }

  /**
   * Simple slugifier for tenant paths
   */
  private _slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-'); // Replace multiple - with single -
  }
}
