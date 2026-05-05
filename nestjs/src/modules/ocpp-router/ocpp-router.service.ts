import * as http from 'http';
import * as WebSocket from 'ws';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { MESSAGE_BROKER_CONFIG, NETWORK_CONNECTION_CONFIG } from '@modules/config/config.tokens';
import {
  type MessageBrokerConfig,
  type NetworkConnectionConfig,
  SecurityProfile,
  WebSocketServerConfig,
} from '@modules/config/config.schema';
import { AmqpService, OcppAmqpMessage } from '@amqp/amqp.service';
import { CacheService } from '@cache/cache.service';
import { CacheNamespace } from '@cache/cache.constants';
import { BasicAuthService } from '@router/basic-auth.service';
import { WebSocketHealthIndicator } from '@health/websocket.health';
import { OcppMessageAuditService } from '@modules/ocpp-message/ocpp-message-audit.service';
import { ChargingStationRepository } from '@repositories/charging-station.repository';
import {
  OCPP_ORIGIN_CHARGER,
  OCPP_STATE_ERROR,
  OCPP_STATE_REQUEST,
  OCPP_STATE_RESPONSE,
} from '@amqp/amqp.tokens';
import { MessageOrigin } from '@enums/message-origin.enum';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { withLogContext } from '@logger/structured-logger';
import { MetricsService } from '@metrics/metrics.service';
import { trace, SpanStatusCode } from '@opentelemetry/api';

const CALL = 2;
const CALL_RESULT = 3;
const CALL_ERROR = 4;

interface PendingCall {
  action: string;
  stationId: string;
  tenantId: number;
}

interface ConnectedStation {
  ws: WebSocket.WebSocket;
  tenantId: number;
  protocol: string;
  pingTimer: NodeJS.Timeout | null;
  pongPending: boolean;
}

interface WsServer {
  httpServer: http.Server;
  wss: WebSocket.WebSocketServer;
}

/**
 * The OCPP router. Terminates charger WebSockets, decodes the OCPP
 * frames, publishes them onto the AMQP bus for whichever module owns
 * the action, and forwards CSMS-initiated CALLs the other direction.
 *
 * One per process. Holds the `Map<stationId, ConnectedStation>` of
 * live websockets, the `pendingCalls` cache for CSMS-initiated CALLs
 * awaiting their CALL_RESULT, and per-frame OTel spans / log context.
 */
@Injectable()
export class OcppRouterService implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(OcppRouterService.name);

  private readonly stations = new Map<string, ConnectedStation>();
  private readonly pendingCalls = new Map<string, PendingCall>();
  private readonly wsServers: WsServer[] = [];

  constructor(
    private readonly amqpService: AmqpService,
    @Inject(MESSAGE_BROKER_CONFIG) private readonly broker: MessageBrokerConfig,
    @Inject(NETWORK_CONNECTION_CONFIG) private readonly net: NetworkConnectionConfig,
    private readonly basicAuthService: BasicAuthService,
    private readonly wsHealth: WebSocketHealthIndicator,
    private readonly auditService: OcppMessageAuditService,
    private readonly metrics: MetricsService,
    private readonly cache: CacheService,
    private readonly chargingStations: ChargingStationRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const instanceId = this.broker.amqp?.instanceIdentifier ?? `router-${process.pid}`;
    await this.amqpService.subscribeRouter(instanceId, async (msg) => {
      if (msg.state === OCPP_STATE_RESPONSE) {
        // Module sent CALL_RESULT → forward to charger
        this.sendCallResult(msg.context.stationId, msg.context.correlationId, msg.payload, {
          action: msg.action,
          tenantId: msg.context.tenantId,
        });
      } else if (msg.state === OCPP_STATE_REQUEST) {
        // CSMS-initiated CALL to charger (e.g. Reset, TriggerMessage)
        this.pendingCalls.set(msg.context.correlationId, {
          action: msg.action,
          stationId: msg.context.stationId,
          tenantId: msg.context.tenantId,
        });
        this.sendCall(
          msg.context.stationId,
          msg.context.correlationId,
          msg.action,
          msg.payload,
          msg.context.tenantId,
        );
      } else if (msg.state === OCPP_STATE_ERROR) {
        // Module rejected an inbound charger CALL → forward CALL_ERROR
        this.sendCallError(
          msg.context.stationId,
          msg.context.correlationId,
          msg.errorCode ?? 'GenericError',
          msg.errorDescription ?? '',
          msg.errorDetails,
          { action: msg.action, tenantId: msg.context.tenantId },
        );
      }
    });
  }

  async onApplicationBootstrap(): Promise<void> {
    for (const wsConfig of this.net.websocketServers) {
      await this.startWsServer(wsConfig);
    }
  }

  async onModuleDestroy(): Promise<void> {
    for (const station of this.stations.values()) {
      if (station.pingTimer) clearInterval(station.pingTimer);
    }
    for (const { wss, httpServer } of this.wsServers) {
      await new Promise<void>((r) => wss.close(() => r()));
      await new Promise<void>((r) => httpServer.close(() => r()));
    }
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async startWsServer(wsConfig: WebSocketServerConfig): Promise<void> {
    const httpServer = http.createServer();
    const wss = new WebSocket.WebSocketServer({
      server: httpServer,
      handleProtocols: (requested) => {
        for (const p of wsConfig.protocols) {
          if (requested.has(p)) return p;
        }
        return false;
      },
      verifyClient: ({ req }, cb) => void this.verifyClient(req, wsConfig, cb),
    });

    wss.on('connection', (ws, req) => {
      const stationId = this.extractStationId(req.url ?? '');
      if (!stationId) {
        ws.close(1008, 'Missing station ID');
        return;
      }

      const protocol = ws.protocol || wsConfig.protocols[0] || OCPPVersion.OCPP2_0_1;
      const { tenantId, pingInterval } = wsConfig;

      this.logger.log(
        `Charger connected: ${stationId} (tenant=${tenantId}, protocol=${protocol}, port=${wsConfig.port})`,
      );

      const pingTimer =
        pingInterval > 0
          ? setInterval(() => this.pingStation(stationId), pingInterval * 1000)
          : null;

      this.stations.set(stationId, { ws, tenantId, protocol, pingTimer, pongPending: false });
      this.metrics.set(
        'citrineos_ws_stations_connected',
        this.stations.size,
        {},
        'Number of charging stations currently connected via WebSocket.',
      );
      void this.amqpService.bindStation(stationId);
      // Materialise a minimal ChargingStations row up-front so the
      // `populate_station_pk_id` trigger can resolve `stationPkId` for any
      // frame that lands before BootNotification finishes its full upsert
      // (e.g. the audit-row write for the BootNotification frame itself).
      // Honours `allowUnknownChargingStations` — if false and the station
      // isn't pre-registered, we leave the row absent so the trigger
      // surfaces the violation.
      if (wsConfig.allowUnknownChargingStations !== false) {
        void this.chargingStations
          .ensureExists(tenantId, stationId)
          .catch((err) =>
            this.logger.warn(`ensureExists failed for ${stationId}: ${(err as Error).message}`),
          );
      }
      // Stash per-connection metadata that downstream handlers consult
      // (chiefly `BootNotification` to honor `allowUnknownChargingStations`).
      // Mirrors legacy `IWebsocketConnection` cached under
      // `CacheNamespace.Connections` keyed by stationId.
      void this.cache
        .set(
          stationId,
          JSON.stringify({
            tenantId,
            protocol,
            allowUnknownChargingStations: wsConfig.allowUnknownChargingStations ?? true,
          }),
          CacheNamespace.Connections,
        )
        .catch((err) =>
          this.logger.warn(
            `Connection cache set failed for ${stationId}: ${(err as Error).message}`,
          ),
        );

      ws.on('pong', () => {
        const s = this.stations.get(stationId);
        if (s) s.pongPending = false;
      });

      ws.on('message', async (data) => {
        try {
          await this.handleFrame(stationId, data.toString());
        } catch (err) {
          this.logger.error(`Frame error from ${stationId}:`, err);
        }
      });

      ws.on('close', () => {
        this.logger.log(`Charger disconnected: ${stationId}`);
        const s = this.stations.get(stationId);
        if (s?.pingTimer) clearInterval(s.pingTimer);
        this.stations.delete(stationId);
        this.metrics.set('citrineos_ws_stations_connected', this.stations.size);
        void this.amqpService.unbindStation(stationId);
        void this.cache
          .remove(stationId, CacheNamespace.Connections)
          .catch((err) =>
            this.logger.warn(
              `Connection cache remove failed for ${stationId}: ${(err as Error).message}`,
            ),
          );
      });

      ws.on('error', (err) => this.logger.error(`WS error for ${stationId}:`, err));
    });

    await new Promise<void>((resolve) => {
      httpServer.listen(wsConfig.port, wsConfig.host, () => {
        this.logger.log(
          `OCPP WebSocket server [${wsConfig.id}] listening on ${wsConfig.host}:${wsConfig.port}` +
            ` (protocols: ${wsConfig.protocols.join(', ')})`,
        );
        this.wsHealth.setListening(wsConfig.port);
        resolve();
      });
    });

    this.wsServers.push({ httpServer, wss });
  }

  private pingStation(stationId: string): void {
    const s = this.stations.get(stationId);
    if (!s) return;
    if (s.pongPending) {
      this.logger.warn(`Ping timeout for ${stationId} — terminating`);
      s.ws.terminate();
      return;
    }
    s.pongPending = true;
    s.ws.ping();
  }

  private async verifyClient(
    req: http.IncomingMessage,
    wsConfig: WebSocketServerConfig,
    cb: (result: boolean, code?: number, message?: string) => void,
  ): Promise<void> {
    if (wsConfig.securityProfile === SecurityProfile.NoSecurity) {
      cb(true);
      return;
    }

    const stationId = this.extractStationId(req.url ?? '');
    if (!stationId) {
      cb(false, 400, 'Missing station ID');
      return;
    }

    if (
      wsConfig.securityProfile === SecurityProfile.BasicAuth ||
      wsConfig.securityProfile === SecurityProfile.BasicAuthTls
    ) {
      const creds = this.basicAuthService.extractCredentials(req);
      if (!creds) {
        cb(false, 401, 'Authorization required');
        return;
      }
      if (creds.username !== stationId) {
        cb(false, 401, 'Unauthorized');
        return;
      }
      const valid = await this.basicAuthService.verifyCredentials(
        wsConfig.tenantId,
        stationId,
        creds.password,
      );
      if (!valid) this.logger.warn(`BasicAuth failed for station ${stationId}`);
      cb(valid, valid ? undefined : 401, valid ? undefined : 'Unauthorized');
      return;
    }

    // MutualTls — client cert verification happens at TLS layer
    cb(true);
  }

  private extractStationId(url: string): string | null {
    const m = url.match(/^\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  private async handleFrame(stationId: string, raw: string): Promise<void> {
    const frame = JSON.parse(raw) as unknown[];
    const [messageType, messageId] = frame as [number, string, ...unknown[]];
    const station = this.stations.get(stationId);
    // Run the entire frame-handling work under a log-context scope so
    // every log line emitted by downstream handlers / services carries
    // the OCPP correlationId + station identity automatically.
    const tracer = trace.getTracer('citrineos.ocpp-router');
    return withLogContext(
      {
        correlationId: messageId,
        stationId,
        tenantId: station?.tenantId,
      },
      () =>
        tracer.startActiveSpan(
          'ocpp.dispatch',
          {
            attributes: {
              'ocpp.station_id': stationId,
              'ocpp.message_type': messageType,
              'ocpp.correlation_id': messageId,
              'tenant.id': station?.tenantId ?? 0,
            },
          },
          async (span) => {
            try {
              return await this.dispatchFrame(stationId, messageType, messageId, frame);
            } catch (err) {
              span.recordException(err as Error);
              span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
              throw err;
            } finally {
              span.end();
            }
          },
        ),
    ) as Promise<void>;
  }

  private async dispatchFrame(
    stationId: string,
    messageType: number,
    messageId: string,
    frame: unknown[],
  ): Promise<void> {
    if (messageType === CALL) {
      const [, , action, payload] = frame as [number, string, string, Record<string, unknown>];
      const s = this.stations.get(stationId);
      const msg: OcppAmqpMessage = {
        origin: OCPP_ORIGIN_CHARGER,
        action,
        state: OCPP_STATE_REQUEST,
        context: {
          correlationId: messageId,
          stationId,
          tenantId: s?.tenantId ?? 1,
          timestamp: new Date().toISOString(),
        },
        payload: payload ?? {},
        protocol: s?.protocol ?? OCPPVersion.OCPP2_0_1,
      };
      await this.amqpService.publishChargerCall(msg);
      this.auditService.recordCall({
        stationId,
        correlationId: messageId,
        action,
        origin: MessageOrigin.ChargingStation,
        payload: payload ?? {},
        tenantId: msg.context.tenantId,
        protocol: msg.protocol,
      });
      this.metrics.inc(
        'citrineos_charger_calls_total',
        { action },
        1,
        'Charger-initiated CALLs received, by action.',
      );
      this.logger.debug(`→ AMQP ChargerCall [${action}] from ${stationId}`);
    } else if (messageType === CALL_RESULT) {
      const [, , responsePayload] = frame as [number, string, Record<string, unknown>];
      const pending = this.pendingCalls.get(messageId);
      if (!pending) {
        this.logger.warn(`No pending call for corrId ${messageId}`);
        return;
      }
      this.pendingCalls.delete(messageId);

      const s = this.stations.get(stationId);
      const msg: OcppAmqpMessage = {
        origin: OCPP_ORIGIN_CHARGER,
        action: pending.action,
        state: OCPP_STATE_RESPONSE,
        context: {
          correlationId: messageId,
          stationId: pending.stationId,
          tenantId: pending.tenantId,
          timestamp: new Date().toISOString(),
        },
        payload: responsePayload ?? {},
        protocol: s?.protocol ?? OCPPVersion.OCPP2_0_1,
      };
      await this.amqpService.publishChargerCallResult(msg);
      this.auditService.recordCallResult({
        stationId: pending.stationId,
        correlationId: messageId,
        action: pending.action,
        origin: MessageOrigin.ChargingStation,
        payload: responsePayload ?? {},
        tenantId: pending.tenantId,
        protocol: msg.protocol,
      });
      this.logger.debug(`← AMQP ChargerCallResult [${pending.action}] from ${stationId}`);
    } else if (messageType === CALL_ERROR) {
      // CALL_ERROR frame format: [4, messageId, errorCode, errorDescription, errorDetails]
      const [, , errorCode, errorDescription, errorDetails] = frame as [
        number,
        string,
        string,
        string,
        Record<string, unknown> | undefined,
      ];
      const pending = this.pendingCalls.get(messageId);
      if (pending) {
        this.pendingCalls.delete(messageId);
        this.logger.error(
          `CallError from ${stationId} for [${pending.action}]: ${errorCode} ${errorDescription}`,
        );
        const s = this.stations.get(stationId);
        this.auditService.recordCallError({
          stationId: pending.stationId,
          correlationId: messageId,
          action: pending.action,
          origin: MessageOrigin.ChargingStation,
          errorCode: errorCode ?? 'GenericError',
          errorDescription: errorDescription ?? '',
          errorDetails,
          tenantId: pending.tenantId,
          protocol: s?.protocol,
        });
      } else {
        this.logger.warn(`CallError from ${stationId} with no pending call (corrId=${messageId})`);
      }
    }
  }

  private sendCallResult(
    stationId: string,
    correlationId: string,
    payload: Record<string, unknown>,
    meta: { action: string; tenantId: number },
  ): void {
    const s = this.stations.get(stationId);
    if (s?.ws.readyState === WebSocket.OPEN) {
      s.ws.send(JSON.stringify([CALL_RESULT, correlationId, payload]));
      this.auditService.recordCallResult({
        stationId,
        correlationId,
        action: meta.action,
        origin: MessageOrigin.ChargingStationManagementSystem,
        payload,
        tenantId: meta.tenantId,
        protocol: s.protocol,
      });
      this.logger.debug(`→ WS CallResult to ${stationId}`);
    } else {
      this.logger.warn(`No open WS for ${stationId} (CallResult dropped)`);
    }
  }

  private sendCall(
    stationId: string,
    correlationId: string,
    action: string,
    payload: Record<string, unknown>,
    tenantId: number,
  ): void {
    const s = this.stations.get(stationId);
    if (s?.ws.readyState === WebSocket.OPEN) {
      s.ws.send(JSON.stringify([CALL, correlationId, action, payload]));
      this.auditService.recordCall({
        stationId,
        correlationId,
        action,
        origin: MessageOrigin.ChargingStationManagementSystem,
        payload,
        tenantId,
        protocol: s.protocol,
      });
      this.logger.debug(`→ WS Call [${action}] to ${stationId}`);
    } else {
      this.logger.warn(`No open WS for ${stationId} (Call [${action}] dropped)`);
    }
  }

  /**
   * Forward a CSMS-emitted CALL_ERROR for an inbound charger CALL —
   * mirrors legacy `sendCallErrorWithMessage`. The wire frame is
   * `[4, messageId, errorCode, errorDescription, errorDetails ?? {}]`
   * per OCPP 2.0.1 §3.2.4 / OCPP-J 1.6 §4.2.2.
   */
  private sendCallError(
    stationId: string,
    correlationId: string,
    errorCode: string,
    errorDescription: string,
    errorDetails: Record<string, unknown> | undefined,
    meta: { action: string; tenantId: number },
  ): void {
    const s = this.stations.get(stationId);
    if (s?.ws.readyState === WebSocket.OPEN) {
      s.ws.send(
        JSON.stringify([
          CALL_ERROR,
          correlationId,
          errorCode,
          errorDescription,
          errorDetails ?? {},
        ]),
      );
      this.auditService.recordCallError({
        stationId,
        correlationId,
        action: meta.action,
        origin: MessageOrigin.ChargingStationManagementSystem,
        errorCode,
        errorDescription,
        errorDetails,
        tenantId: meta.tenantId,
        protocol: s.protocol,
      });
      this.logger.debug(`→ WS CallError [${meta.action}] to ${stationId}: ${errorCode}`);
    } else {
      this.logger.warn(`No open WS for ${stationId} (CallError [${meta.action}] dropped)`);
    }
  }
}
