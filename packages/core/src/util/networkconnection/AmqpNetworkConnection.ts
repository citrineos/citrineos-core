// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  ICache,
  IMessageRouter,
  INetworkConnection,
  IWebsocketConnection,
  OcppGatewayConfig,
  SystemConfig,
} from '@citrineos/base';
import {
  CacheNamespace,
  createIdentifier,
  DEFAULT_TENANT_ID,
  getStationIdFromIdentifier,
  OCPPVersion,
} from '@citrineos/base';
import type * as amqplib from 'amqplib';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { RabbitMQChannelManager } from '../queue/rabbit-mq/ChannelManager.js';

// Routing key protocol atoms used by the rabbitmq_web_ocpp plugin, mapped to
// the OCPP subprotocol names used throughout CitrineOS. The plugin also
// accepts ocpp1.2/1.5/2.0 stations; their traffic is dropped here as those
// versions are not supported by CitrineOS.
const PROTOCOL_BY_ROUTING_ATOM: Record<string, OCPPVersion> = {
  ocpp16: OCPPVersion.OCPP1_6,
  ocpp201: OCPPVersion.OCPP2_0_1,
  ocpp21: OCPPVersion.OCPP2_1,
};

/**
 * {@link INetworkConnection} implementation for broker-terminated websockets
 * via the rabbitmq_web_ocpp plugin. Charging stations connect to RabbitMQ
 * directly; the plugin publishes each inbound OCPP-J frame to a topic exchange
 * with routing key `<protocol>.<action>.<req|conf|error>`, `reply_to` set to
 * the station id and `correlation_id` set to the OCPP messageId. Frames
 * published to that exchange with routing key `<station id>` are delivered to
 * the station's websocket via its durable `ocpp.<station id>` queue.
 *
 * All instances consume one shared queue as competing consumers — no instance
 * owns a socket, so no per-station routing back to a specific instance is
 * needed; request/response correlation lives in the shared cache.
 *
 * Connection presence is event-driven: any inbound frame from a station that
 * has no entry in the Connections cache namespace registers it with the
 * router; the plugin's synthetic offline StatusNotification (vendorId
 * "rabbitmq", vendorErrorCode "Offline", connectorId 0) deregisters it and is
 * not forwarded to modules. A TTL refreshed by inbound traffic acts as a
 * backstop for the rare case where the broker dies without emitting the
 * synthetic offline frame.
 */
export class AmqpNetworkConnection implements INetworkConnection {
  private static readonly CHANNEL_ID = 'ocpp-gateway';
  private static readonly INBOUND_BINDINGS = ['*.*.req', '*.*.conf', '*.*.error'];
  private static readonly CONSUMER_RESTART_DELAY_MS = 5000;

  protected _cache: ICache;
  protected _logger: Logger<ILogObj>;
  private readonly _gatewayConfig: OcppGatewayConfig;
  private readonly _channelManager: RabbitMQChannelManager;
  private readonly _router: IMessageRouter;
  private readonly _doesChargingStationExistByStationId?: (
    tenantId: number,
    ocppConnectionName: string,
  ) => Promise<boolean>;
  private _consumerTag?: string;
  private _restartTimer?: NodeJS.Timeout;
  private _shutdownRequested = false;

  constructor({
    config,
    cache,
    router,
    channelManager,
    logger,
    doesChargingStationExistByStationId,
  }: {
    config: SystemConfig;
    cache: ICache;
    router: IMessageRouter;
    channelManager: RabbitMQChannelManager;
    logger: Logger<ILogObj>;
    doesChargingStationExistByStationId: (
      tenantId: number,
      ocppConnectionName: string,
    ) => Promise<boolean>;
  }) {
    const gatewayConfig = config.util.networkConnection.ocppGateway;
    if (!gatewayConfig) {
      throw new Error('AmqpNetworkConnection requires util.networkConnection.ocppGateway config');
    }
    this._gatewayConfig = gatewayConfig;
    this._cache = cache;
    this._channelManager = channelManager;
    this._doesChargingStationExistByStationId = doesChargingStationExistByStationId;
    this._logger = logger.getSubLogger({ name: this.constructor.name });
    router.networkHook = this.sendMessage.bind(this);
    this._router = router;

    this._channelManager.getConnectionManager().on('connected', () => {
      this._consumerTag = undefined;
      this._startConsuming().catch((error) => {
        this._logger.error('Failed to restart OCPP gateway consumer after reconnect', error);
        this._scheduleConsumerRestart();
      });
    });

    this._startConsuming().catch((error) => {
      this._logger.error('Failed to start OCPP gateway consumer', error);
      this._scheduleConsumerRestart();
    });
  }

  /**
   * Send a raw OCPP-J frame to the charging station identified by the identifier.
   * Publishes to the gateway exchange with routing key = station id; the plugin
   * routes it into the station's ocpp.<station id> queue and down its websocket.
   */
  async sendMessage(identifier: string, message: string): Promise<void> {
    const stationId = getStationIdFromIdentifier(identifier);
    const channel = await this._channelManager.getChannel(AmqpNetworkConnection.CHANNEL_ID);

    let correlationId: string | undefined;
    try {
      correlationId = JSON.parse(message)[1];
    } catch {
      // Router only hands over already-validated frames; guard regardless.
    }

    const published = channel.publish(
      this._gatewayConfig.exchange,
      stationId,
      Buffer.from(message, 'utf-8'),
      {
        contentType: 'application/json',
        contentEncoding: 'utf-8',
        correlationId,
      },
    );
    if (!published) {
      throw new Error(`Failed to publish message to gateway for ${identifier}`);
    }
  }

  bindNetworkHook(): (identifier: string, message: string) => Promise<void> {
    return (identifier: string, message: string) => this.sendMessage(identifier, message);
  }

  /**
   * The websocket lives in the broker; it cannot be closed from here.
   * Only the router registration and cached presence are cleaned up.
   * Closing the socket itself requires broker-side action (e.g. rabbitmqctl close_connection
   * or implement curl -X DELETE 'http://localhost:15672/api/connections/192.168.65.1%3A27187%20-%3E%20172.27.0.4%3A19520').
   */
  async disconnect(tenantId: number, ocppConnectionName: string): Promise<boolean> {
    this._logger.warn(
      `Disconnect requested for ${tenantId}:${ocppConnectionName}: the websocket is terminated ` +
        `by the broker and cannot be closed by CitrineOS; deregistering only.`,
    );
    const identifier = createIdentifier(tenantId, ocppConnectionName);
    await this._cache.remove(identifier, CacheNamespace.Connections);
    return await this._router.deregisterConnection(tenantId, ocppConnectionName);
  }

  /**
   * Stops consuming station traffic. Stations stay connected to the broker and
   * their frames stay queued for the remaining (or next) CitrineOS instances,
   * so no connections are deregistered here.
   */
  async shutdown(): Promise<void> {
    this._shutdownRequested = true;
    if (this._restartTimer) {
      clearTimeout(this._restartTimer);
      this._restartTimer = undefined;
    }
    if (this._consumerTag) {
      const channel = await this._channelManager.getChannel(AmqpNetworkConnection.CHANNEL_ID);
      await channel.cancel(this._consumerTag);
      this._consumerTag = undefined;
    }
    await this._channelManager.closeChannel(AmqpNetworkConnection.CHANNEL_ID);
  }

  private async _startConsuming(): Promise<void> {
    if (this._shutdownRequested || this._consumerTag) {
      return;
    }
    const { exchange, queue, prefetch } = this._gatewayConfig;
    const channel = await this._channelManager.getChannel(AmqpNetworkConnection.CHANNEL_ID);

    // amq.* exchanges are broker-predeclared and cannot be re-asserted.
    if (exchange.startsWith('amq.')) {
      await channel.checkExchange(exchange);
    } else {
      await channel.assertExchange(exchange, 'topic', { durable: true });
    }

    await channel.assertQueue(queue, { durable: true, autoDelete: false, exclusive: false });
    for (const bindingKey of AmqpNetworkConnection.INBOUND_BINDINGS) {
      await channel.bindQueue(queue, exchange, bindingKey);
    }
    await channel.prefetch(prefetch);

    const { consumerTag } = await channel.consume(queue, (message) => {
      if (!message) {
        this._logger.warn('Gateway consumer cancelled by broker');
        this._consumerTag = undefined;
        this._scheduleConsumerRestart();
        return;
      }
      this._onMessage(message, channel).catch((error) => {
        this._logger.error('Unexpected error handling gateway message', error);
      });
    });
    // A channel can die while the connection stays up (e.g. a precondition
    // failure); the connection-level 'connected' handler never fires then, so
    // restart from here as well.
    channel.once('close', () => {
      this._consumerTag = undefined;
      this._scheduleConsumerRestart();
    });
    this._consumerTag = consumerTag;
    this._logger.info(
      `Consuming station traffic from queue '${queue}' bound to exchange '${exchange}'`,
    );
  }

  /**
   * True while this instance holds an active consumer on the gateway queue —
   * the transport-level readiness signal, analogous to the websocket
   * transport's listening HTTP servers.
   */
  isConsuming(): boolean {
    return this._consumerTag !== undefined;
  }

  private _scheduleConsumerRestart(): void {
    if (this._shutdownRequested || this._restartTimer) {
      return;
    }
    this._restartTimer = setTimeout(() => {
      this._restartTimer = undefined;
      this._startConsuming().catch((error) => {
        this._logger.error('Failed to restart OCPP gateway consumer', error);
        this._scheduleConsumerRestart();
      });
    }, AmqpNetworkConnection.CONSUMER_RESTART_DELAY_MS);
  }

  private async _onMessage(
    message: amqplib.ConsumeMessage,
    channel: amqplib.Channel,
  ): Promise<void> {
    // Processing errors must not requeue: the router replies to malformed
    // Calls with a CallError itself, and redelivery would just loop.
    try {
      const [protocolAtom, action, direction] = message.fields.routingKey.split('.');
      const stationId = message.properties.replyTo;
      if (!stationId) {
        this._logger.warn(
          `Discarding gateway message without reply_to (routing key ${message.fields.routingKey})`,
        );
        return;
      }

      const protocol = PROTOCOL_BY_ROUTING_ATOM[protocolAtom];
      if (!protocol) {
        this._logger.warn(
          `Discarding message from ${stationId} with unsupported OCPP version '${protocolAtom}'`,
        );
        return;
      }

      const tenantId = this._gatewayConfig.tenantId ?? DEFAULT_TENANT_ID;
      const identifier = createIdentifier(tenantId, stationId);
      const frame = message.content.toString('utf-8');

      if (
        direction === 'req' &&
        action === 'StatusNotification' &&
        this._isSyntheticOffline(frame)
      ) {
        await this._onStationOffline(tenantId, stationId, identifier);
        return;
      }

      const online = await this._refreshPresence(tenantId, stationId, identifier, protocol);
      if (!online) {
        return; // unknown station or failed registration; frame dropped
      }

      const timestamp = message.properties.timestamp
        ? new Date(message.properties.timestamp * 1000)
        : new Date();
      await this._router.onMessage(identifier, frame, timestamp, protocol);
    } catch (error) {
      this._logger.error('Error processing gateway message', error);
    } finally {
      channel.ack(message);
    }
  }

  /**
   * Ensures the station is registered as connected, refreshing the presence
   * TTL on every inbound frame. Returns false if the frame should be dropped.
   *
   * Registration happens on the first frame even when the station has no DB
   * row yet (its first BootNotification creates it in the Configuration
   * module) — the cache entry carries allowUnknownChargingStations for the
   * boot handler, and the AMQP subscriptions must exist for the
   * BootNotificationResponse to reach the router. Only the isOnline update
   * inside registerConnection is skipped for a missing row, so the entry is
   * flagged and the flag resolved on a later frame once the row exists.
   */
  private async _refreshPresence(
    tenantId: number,
    stationId: string,
    identifier: string,
    protocol: OCPPVersion,
  ): Promise<boolean> {
    const { presenceTimeoutSeconds, allowUnknownChargingStations } = this._gatewayConfig;
    const existingJson = await this._cache.get<string>(identifier, CacheNamespace.Connections);
    if (existingJson) {
      const refreshedJson = await this._completePendingRegistration(
        tenantId,
        stationId,
        identifier,
        protocol,
        existingJson,
      );
      await this._cache.set(
        identifier,
        refreshedJson,
        CacheNamespace.Connections,
        presenceTimeoutSeconds,
      );
      return true;
    }

    const exists = this._doesChargingStationExistByStationId
      ? await this._doesChargingStationExistByStationId(tenantId, stationId)
      : true;
    if (!exists && !allowUnknownChargingStations) {
      this._logger.warn(`Dropping message from unknown station ${stationId} (tenant ${tenantId})`);
      return false;
    }

    const connection: IWebsocketConnection & { onlinePending?: boolean } = {
      id: AmqpNetworkConnection.CHANNEL_ID,
      timeConnected: new Date().toISOString(),
      protocol,
      allowUnknownChargingStations,
      // No DB row yet: registerConnection's isOnline update will be skipped;
      // flag the entry so a later frame re-applies it once the row exists.
      ...(exists ? {} : { onlinePending: true }),
    };
    // Atomic claim: with competing consumers another instance may register the
    // same station concurrently; the loser just proceeds with its frame.
    const claimed = await this._cache.setIfNotExist(
      identifier,
      JSON.stringify(connection),
      CacheNamespace.Connections,
      presenceTimeoutSeconds,
    );
    if (!claimed) {
      return true;
    }

    const registered = await this._router.registerConnection(tenantId, stationId, protocol);
    if (!registered) {
      this._logger.error(`Failed to register connection for ${identifier}`);
      await this._cache.remove(identifier, CacheNamespace.Connections).catch((error) => {
        this._logger.error(`Failed to remove connection entry ${identifier} from cache`, error);
      });
      return false;
    }
    this._logger.info(
      `Station connected via gateway: ${identifier} (${protocol})` +
        (exists ? '' : ' — awaiting provisioning to mark it online'),
    );
    return true;
  }

  /**
   * Resolves the onlinePending flag on a presence entry: once the station row
   * exists (created by its first BootNotification), re-runs registerConnection
   * — idempotent, so only the previously-skipped isOnline / protocol update
   * takes effect. The flag lives in the shared cache so any
   * competing-consumer instance can resolve it.
   */
  private async _completePendingRegistration(
    tenantId: number,
    stationId: string,
    identifier: string,
    protocol: OCPPVersion,
    entryJson: string,
  ): Promise<string> {
    let entry: IWebsocketConnection & { onlinePending?: boolean };
    try {
      entry = JSON.parse(entryJson);
    } catch {
      return entryJson;
    }
    if (!entry.onlinePending) {
      return entryJson;
    }
    const exists = this._doesChargingStationExistByStationId
      ? await this._doesChargingStationExistByStationId(tenantId, stationId)
      : true;
    if (!exists) {
      return entryJson;
    }
    const registered = await this._router.registerConnection(tenantId, stationId, protocol);
    if (!registered) {
      return entryJson;
    }
    delete entry.onlinePending;
    this._logger.info(`Station provisioned and marked online: ${identifier} (${protocol})`);
    return JSON.stringify(entry);
  }

  private async _onStationOffline(
    tenantId: number,
    stationId: string,
    identifier: string,
  ): Promise<void> {
    this._logger.info(`Station disconnected from gateway: ${identifier}`);
    await this._cache.remove(identifier, CacheNamespace.Connections);
    await this._router.deregisterConnection(tenantId, stationId);
  }

  /**
   * Detects the plugin's synthetic offline StatusNotification, published on
   * the station's behalf when its websocket closes for any reason. OCPP 1.6
   * carries vendorId/vendorErrorCode at the payload root; OCPP 2.x inside
   * customData.
   */
  private _isSyntheticOffline(frame: string): boolean {
    try {
      const payload = JSON.parse(frame)[3];
      const vendorInfo = payload?.customData ?? payload;
      return vendorInfo?.vendorId === 'rabbitmq' && vendorInfo?.vendorErrorCode === 'Offline';
    } catch {
      return false;
    }
  }
}
