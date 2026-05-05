import * as amqp from 'amqplib';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { propagation, context as otelContext } from '@opentelemetry/api';
import { MESSAGE_BROKER_CONFIG } from '@modules/config/config.tokens';
import type { MessageBrokerConfig } from '@modules/config/config.schema';
import { OCPPVersion } from '@ocpp/ocpp-version';
import {
  AMQP_EXCHANGE_TYPE,
  MessageOriginHeader,
  MessageStateHeader,
  OCPP_ORIGIN_CSMS,
  OCPP_STATE_ERROR,
  OCPP_STATE_REQUEST,
  OCPP_STATE_RESPONSE,
  X_MATCH_ALL,
  X_MATCH_ANY,
  queueNames,
  subscriptionLabels,
} from '@amqp/amqp.tokens';

export interface OcppAmqpMessage {
  origin: 'cs' | 'csms';
  action: string;
  state: number; // 1=request, 2=response, 3=error
  context: {
    correlationId: string;
    stationId: string;
    tenantId: number;
    timestamp: string;
  };
  payload: Record<string, unknown>;
  protocol: string;
  // CALL_ERROR-only fields. `state === 3` rows carry an OCPP error frame
  // that the router translates into `[4, msgId, errorCode, errorDescription, errorDetails]`
  // on the WS. Untouched on Request / Response frames.
  errorCode?: string;
  errorDescription?: string;
  errorDetails?: Record<string, unknown>;
}

// Header-value short aliases — kept as locals so the publish helpers
// below stay terse. Source of truth is `@amqp/amqp.tokens`.
const ORIGIN_CHARGER = MessageOriginHeader.ChargingStation;
const ORIGIN_CSMS = MessageOriginHeader.ChargingStationManagementSystem;
const STATE_REQUEST = MessageStateHeader.Request;
const STATE_RESPONSE = MessageStateHeader.Response;
const STATE_ERROR = MessageStateHeader.Error;

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection['createChannel']>>;

type SubscriptionFactory = () => Promise<void>;

/**
 * Single connection broker for the entire process. Owns one publish
 * channel and one router-instance channel; module subscriptions each
 * get their own channel keyed by event group. The whole topology
 * (exchanges, queues, bindings) is rebuilt on reconnect by replaying
 * the registered `subscriptionFactories`, so a RabbitMQ blip never
 * leaves a service partially routable.
 */
@Injectable()
export class AmqpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AmqpService.name);
  private readonly url: string;
  private readonly exchange: string;

  private connection: AmqpConnection | null = null;
  private publishChannel: AmqpChannel | null = null;
  private connected = false;
  private destroyed = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  // Registry of subscription factories — replayed on reconnect
  private readonly subscriptionFactories: SubscriptionFactory[] = [];

  // Per-subscription readiness tracking, surfaced via the health indicator.
  // Key: human-readable label (`module:transactions`, `webhooks`, etc.).
  // Value: `true` once the factory's queue/consumer is up; `false` while
  // waiting for the connection.
  private readonly subscriptionStatus = new Map<string, boolean>();

  // Router mode: per-instance queue
  private instanceQueueName: string | null = null;
  private instanceChannel: AmqpChannel | null = null;
  private readonly stationBindings = new Map<string, Record<string, string>[]>();

  constructor(@Inject(MESSAGE_BROKER_CONFIG) private readonly broker: MessageBrokerConfig) {
    const amqp = broker.amqp;
    if (!amqp) throw new Error('util.messageBroker.amqp must be configured');
    this.url = amqp.url;
    this.exchange = amqp.exchange;
  }

  async onModuleInit(): Promise<void> {
    await this._connect();
  }

  async onModuleDestroy(): Promise<void> {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    await this.publishChannel?.close().catch(() => {});
    await this.instanceChannel?.close().catch(() => {});
    await this.connection?.close().catch(() => {});
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Per-subscription readiness map. Used by the health indicator to
   * surface "the module's queues are bound" versus "we registered a
   * subscription but RabbitMQ isn't connected yet".
   */
  getSubscriptionStatus(): Record<string, boolean> {
    return Object.fromEntries(this.subscriptionStatus);
  }

  // ─── Module subscription API ─────────────────────────────────────────────

  /**
   * Subscribe a module to charger CALL messages (and optionally CALL_RESULT messages).
   * Creates `{moduleName}_requests` queue (and `{moduleName}_responses` if responseActions given).
   * Mirrors original AbstractModule._initHandler() queue topology.
   *
   * The `requestHandler` receives each charger CALL and returns the response payload.
   * AmqpService auto-publishes the CALL_RESULT back toward the router.
   */
  async subscribeModule(
    moduleName: string,
    requestActions: string[],
    requestHandler: (msg: OcppAmqpMessage) => Promise<Record<string, unknown> | null>,
    responseActions?: string[],
    responseHandler?: (msg: OcppAmqpMessage) => Promise<void>,
  ): Promise<void> {
    const requestLabel = subscriptionLabels.moduleRequests(moduleName);
    const responseLabel = subscriptionLabels.moduleResponses(moduleName);
    if (requestActions.length > 0) this.subscriptionStatus.set(requestLabel, false);
    if (responseActions && responseActions.length > 0 && responseHandler) {
      this.subscriptionStatus.set(responseLabel, false);
    }

    const factory: SubscriptionFactory = async () => {
      if (!this.connection || !this.connected) return;

      if (requestActions.length > 0) {
        const ch = await this.connection.createChannel();
        await ch.assertExchange(this.exchange, AMQP_EXCHANGE_TYPE, { durable: false });
        const qName = queueNames.moduleRequests(moduleName);
        await ch.assertQueue(qName, { durable: true, autoDelete: true, exclusive: false });
        for (const action of requestActions) {
          await ch.bindQueue(qName, this.exchange, '', {
            'x-match': X_MATCH_ALL,
            origin: ORIGIN_CHARGER,
            state: STATE_REQUEST,
            action,
          });
        }
        await ch.consume(qName, async (raw) => {
          if (!raw) return;
          const msg = JSON.parse(raw.content.toString()) as OcppAmqpMessage;
          try {
            const payload = await requestHandler(msg);
            // null = handler invoked respond() itself. Don't double-publish.
            if (payload !== null) {
              await this._publishCsmsResponse(msg, payload);
            }
            ch.ack(raw);
          } catch (err) {
            this.logger.error(`Error in ${moduleName} request handler [${msg.action}]:`, err);
            ch.nack(raw, false, false);
          }
        });
        this.subscriptionStatus.set(requestLabel, true);
        this.logger.debug(`Module queue ready: ${qName} (${requestActions.length} actions)`);
      }

      if (responseActions && responseActions.length > 0 && responseHandler) {
        const ch = await this.connection.createChannel();
        await ch.assertExchange(this.exchange, AMQP_EXCHANGE_TYPE, { durable: false });
        const qName = queueNames.moduleResponses(moduleName);
        await ch.assertQueue(qName, { durable: true, autoDelete: true, exclusive: false });
        for (const action of responseActions) {
          await ch.bindQueue(qName, this.exchange, '', {
            'x-match': X_MATCH_ALL,
            origin: ORIGIN_CHARGER,
            state: STATE_RESPONSE,
            action,
          });
        }
        await ch.consume(qName, async (raw) => {
          if (!raw) return;
          const msg = JSON.parse(raw.content.toString()) as OcppAmqpMessage;
          try {
            await responseHandler(msg);
            ch.ack(raw);
          } catch (err) {
            this.logger.error(`Error in ${moduleName} response handler [${msg.action}]:`, err);
            ch.nack(raw, false, false);
          }
        });
        this.subscriptionStatus.set(responseLabel, true);
        this.logger.debug(`Module response queue ready: ${qName}`);
      }
    };

    this.subscriptionFactories.push(factory);
    if (this.connected) await factory();
  }

  // ─── Router subscription API ─────────────────────────────────────────────

  /**
   * Initialize the per-instance router queue.
   * In a horizontally scaled setup each OcppRouter instance gets its own queue.
   * Only messages for chargers connected to THIS instance are delivered here.
   */
  async subscribeRouter(
    instanceId: string,
    handler: (msg: OcppAmqpMessage) => Promise<void>,
  ): Promise<void> {
    this.instanceQueueName = queueNames.routerInstance(instanceId);

    const factory: SubscriptionFactory = async () => {
      if (!this.connection || !this.connected) return;

      this.instanceChannel = await this.connection.createChannel();
      await this.instanceChannel.assertExchange(this.exchange, AMQP_EXCHANGE_TYPE, {
        durable: false,
      });
      // `instanceId` is per-process (`router-${hostname}-${pid}`), so each
      // restart produces a fresh queue name. `autoDelete: true` lets
      // RabbitMQ reap the queue on consumer disconnect — matches legacy
      // and prevents orphaned queues from accumulating after restarts.
      // The reconnect path in `_connect` re-asserts the queue and
      // re-binds every tracked station via `subscriptionFactories`, so
      // dropping the queue on disconnect doesn't lose routing state.
      await this.instanceChannel.assertQueue(this.instanceQueueName!, {
        durable: false,
        autoDelete: true,
        exclusive: false,
      });

      // Re-bind all currently tracked stations (reconnect case)
      for (const bindings of this.stationBindings.values()) {
        for (const args of bindings) {
          await this.instanceChannel.bindQueue(this.instanceQueueName!, this.exchange, '', args);
        }
      }

      await this.instanceChannel.consume(this.instanceQueueName!, async (raw) => {
        if (!raw) return;
        const msg = JSON.parse(raw.content.toString()) as OcppAmqpMessage;
        try {
          await handler(msg);
          this.instanceChannel!.ack(raw);
        } catch (err) {
          this.logger.error('Router handler error:', err);
          this.instanceChannel!.nack(raw, false, false);
        }
      });

      this.subscriptionStatus.set(subscriptionLabels.router(this.instanceQueueName!), true);
      this.logger.log(`Router instance queue ready: ${this.instanceQueueName}`);
    };

    this.subscriptionFactories.push(factory);
    if (this.connected) await factory();
  }

  /**
   * Subscribe a webhook fan-out consumer that receives EVERY OCPP frame
   * (any origin, any state, any action). Used by `WebhookService` to fan
   * out to operator-configured HTTP endpoints.
   */
  async subscribeWebhooks(handler: (msg: OcppAmqpMessage) => Promise<void>): Promise<void> {
    const factory: SubscriptionFactory = async () => {
      if (!this.connection || !this.connected) return;
      const ch = await this.connection.createChannel();
      await ch.assertExchange(this.exchange, AMQP_EXCHANGE_TYPE, { durable: false });
      const qName = queueNames.webhooks();
      await ch.assertQueue(qName, { durable: false, autoDelete: true, exclusive: false });
      // Bind with x-match=any + truthy header to match every published message.
      await ch.bindQueue(qName, this.exchange, '', {
        'x-match': X_MATCH_ANY,
        origin: ORIGIN_CHARGER,
      });
      await ch.bindQueue(qName, this.exchange, '', {
        'x-match': X_MATCH_ANY,
        origin: ORIGIN_CSMS,
      });
      await ch.consume(qName, async (raw) => {
        if (!raw) return;
        try {
          const msg = JSON.parse(raw.content.toString()) as OcppAmqpMessage;
          await handler(msg);
          ch.ack(raw);
        } catch (err) {
          this.logger.warn(`Webhook handler error: ${(err as Error).message}`);
          ch.nack(raw, false, false);
        }
      });
      this.subscriptionStatus.set(subscriptionLabels.webhooks, true);
      this.logger.debug(`Webhook fan-out queue ready: ${qName}`);
    };
    this.subscriptionStatus.set('webhooks', false);
    this.subscriptionFactories.push(factory);
    if (this.connected) await factory();
  }

  /** Bind a newly connected charger's messages to this router instance. */
  async bindStation(stationId: string): Promise<void> {
    if (!this.instanceQueueName || !this.instanceChannel) return;
    const args: Record<string, string> = {
      'x-match': X_MATCH_ALL,
      origin: ORIGIN_CSMS,
      stationId,
    };
    await this.instanceChannel.bindQueue(this.instanceQueueName, this.exchange, '', args);
    const existing = this.stationBindings.get(stationId) ?? [];
    this.stationBindings.set(stationId, [...existing, args]);
    this.logger.debug(`Bound station ${stationId} to router queue ${this.instanceQueueName}`);
  }

  /** Remove bindings when a charger disconnects. */
  async unbindStation(stationId: string): Promise<void> {
    if (!this.instanceQueueName || !this.instanceChannel) return;
    const bindings = this.stationBindings.get(stationId) ?? [];
    this.stationBindings.delete(stationId);
    for (const args of bindings) {
      await this.instanceChannel
        .unbindQueue(this.instanceQueueName, this.exchange, '', args)
        .catch(() => {});
    }
    this.logger.debug(`Unbound station ${stationId} from router queue`);
  }

  // ─── Publish helpers ─────────────────────────────────────────────────────

  /** Router → modules: charger sent a CALL (request to CSMS). */
  async publishChargerCall(msg: OcppAmqpMessage): Promise<void> {
    await this._publish(msg, {
      origin: ORIGIN_CHARGER,
      state: STATE_REQUEST,
      action: msg.action,
      stationId: msg.context.stationId,
    });
  }

  /** Router → modules: charger sent a CALL_RESULT (response to CSMS-initiated call). */
  async publishChargerCallResult(msg: OcppAmqpMessage): Promise<void> {
    await this._publish(msg, {
      origin: ORIGIN_CHARGER,
      state: STATE_RESPONSE,
      action: msg.action,
      stationId: msg.context.stationId,
    });
  }

  /** Modules → router: CSMS initiates a Call to a charger (e.g., Reset, TriggerMessage). */
  async sendCall(
    action: string,
    stationId: string,
    tenantId: number,
    payload: Record<string, unknown>,
    correlationId: string = crypto.randomUUID(),
  ): Promise<void> {
    const msg: OcppAmqpMessage = {
      origin: OCPP_ORIGIN_CSMS,
      action,
      state: OCPP_STATE_REQUEST,
      context: { correlationId, stationId, tenantId, timestamp: new Date().toISOString() },
      payload,
      protocol: OCPPVersion.OCPP2_0_1,
    };
    await this._publish(msg, {
      origin: ORIGIN_CSMS,
      state: STATE_REQUEST,
      action,
      stationId,
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  /**
   * Publish CSMS CALL_RESULT to the router queue (which delivers to the charger).
   * Public so handlers can respond early via `OcppMessage.respond()` — see
   * `AbstractOcppModule` for the wiring.
   */
  async publishCsmsResponse(
    requestMsg: OcppAmqpMessage,
    payload: Record<string, unknown>,
  ): Promise<void> {
    return this._publishCsmsResponse(requestMsg, payload);
  }

  /**
   * Publish a CSMS CALL_ERROR for an inbound charger CALL. The router
   * picks it up off `state === 3` and sends `[4, msgId, errorCode,
   * errorDescription, errorDetails]` over the WS. Mirrors legacy
   * `sendCallErrorWithMessage`.
   */
  async publishCsmsCallError(
    requestMsg: OcppAmqpMessage,
    errorCode: string,
    errorDescription: string,
    errorDetails?: Record<string, unknown>,
  ): Promise<void> {
    const errorMsg: OcppAmqpMessage = {
      ...requestMsg,
      origin: OCPP_ORIGIN_CSMS,
      state: OCPP_STATE_ERROR,
      payload: {},
      errorCode,
      errorDescription,
      ...(errorDetails ? { errorDetails } : {}),
      context: { ...requestMsg.context, timestamp: new Date().toISOString() },
    };
    await this._publish(errorMsg, {
      origin: ORIGIN_CSMS,
      state: STATE_ERROR,
      action: requestMsg.action,
      stationId: requestMsg.context.stationId,
    });
  }

  /** Publish CSMS CALL_RESULT to the router queue (which delivers to the charger). */
  private async _publishCsmsResponse(
    requestMsg: OcppAmqpMessage,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const responseMsg: OcppAmqpMessage = {
      ...requestMsg,
      origin: OCPP_ORIGIN_CSMS,
      state: OCPP_STATE_RESPONSE,
      payload,
      context: { ...requestMsg.context, timestamp: new Date().toISOString() },
    };
    await this._publish(responseMsg, {
      origin: ORIGIN_CSMS,
      state: STATE_RESPONSE,
      action: requestMsg.action,
      stationId: requestMsg.context.stationId,
    });
  }

  private async _publish(msg: OcppAmqpMessage, headers: Record<string, string>): Promise<void> {
    if (!this.publishChannel || !this.connected) {
      this.logger.warn(`Cannot publish [${msg.action}]: not connected to RabbitMQ`);
      return;
    }
    // Inject the W3C trace context onto `msg.context` so the receiving
    // module can extract it and start its handler span as a child of the
    // current router span. No-op when no span is active.
    const carrier: Record<string, string> = {};
    propagation.inject(otelContext.active(), carrier);
    if (carrier.traceparent) {
      (msg.context as Record<string, unknown>).traceparent = carrier.traceparent;
      if (carrier.tracestate) {
        (msg.context as Record<string, unknown>).tracestate = carrier.tracestate;
      }
    }
    this.publishChannel.publish(this.exchange, '', Buffer.from(JSON.stringify(msg)), {
      headers,
      contentType: 'application/json',
    });
  }

  private async _connect(): Promise<void> {
    if (this.destroyed) return;
    try {
      this.connection = await amqp.connect(this.url);
      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error:', err);
        this._onDisconnect();
      });
      this.connection.on('close', () => {
        if (!this.destroyed) {
          this.logger.warn('RabbitMQ connection closed — scheduling reconnect');
          this._onDisconnect();
        }
      });

      this.publishChannel = await this.connection.createChannel();
      await this.publishChannel.assertExchange(this.exchange, AMQP_EXCHANGE_TYPE, {
        durable: false,
      });

      this.connected = true;
      this.logger.log(`Connected to RabbitMQ (exchange: ${this.exchange})`);

      // Replay all module/router subscriptions (handles reconnect)
      await Promise.all(
        this.subscriptionFactories.map((fn) =>
          fn().catch((e) => this.logger.error('Subscription replay error:', e)),
        ),
      );
    } catch (err) {
      this.logger.error('RabbitMQ connection failed:', err);
      this._scheduleReconnect();
    }
  }

  private _onDisconnect(): void {
    this.connected = false;
    this.connection = null;
    this.publishChannel = null;
    this.instanceChannel = null;
    this._scheduleReconnect();
  }

  private _scheduleReconnect(delayMs = 5000): void {
    if (this.destroyed || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this._connect().catch((e) => this.logger.error('Reconnect attempt failed:', e));
    }, delayMs);
  }
}
