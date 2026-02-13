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
  WebsocketServerConfig,
} from '@citrineos/base';
import { AbstractModule, EventGroup } from '@citrineos/base';
import { RabbitMqReceiver, RabbitMqSender } from '@citrineos/util';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { type ITenantRepository, SequelizeTenantRepository, Tenant } from '@citrineos/data';

/**
 * Type-safe tenant events
 */
export interface TenantEvents {
  TenantCreated: (tenant: Tenant, websocketServerConfig?: WebsocketServerConfig) => void;
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
   * Creates a tenant and emits an event
   */
  async createTenant(
    tenant: Tenant,
    websocketServerConfig?: WebsocketServerConfig,
  ): Promise<Tenant> {
    const createdTenant = await this._tenantRepository.createTenant(tenant);

    this._logger?.info(`Tenant created: ${createdTenant.id} — emitting TenantCreated event`);

    this._emit('TenantCreated', createdTenant, websocketServerConfig);

    return createdTenant;
  }
}
