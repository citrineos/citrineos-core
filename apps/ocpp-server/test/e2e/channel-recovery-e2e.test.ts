// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { CitrineOSServer } from '@citrineos/ocpp';
import { ConfigLoader, type IMessageRouter } from '@citrineos/base';
import { OCPP_CallAction, OCPPVersion, type OCPP1_6, type OCPP2_0_1 } from '@citrineos/types';
import type { RabbitMQChannelManager, RabbitMQConnectionManager } from '@citrineos/ocpp';
import { execFileSync, execSync } from 'child_process';
import { randomBytes } from 'crypto';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { type AddressInfo, createServer } from 'net';
import { mkdtempSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';

const SERVER_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const EXCHANGE = 'citrineos';
const INSTANCE = `channel-recovery-${process.pid}-${Date.now()}`;
const ROUTER_QUEUE = `rabbit_queue_router_${INSTANCE}`;
const TRANSACTIONS_CHANNEL = 'module-receiver-transactions_requests';
const TRANSACTIONS_QUEUE = 'rabbit_queue_transactions_requests';
const RABBIT_TEST_USER = `channel_recovery_${process.pid}`;
const RABBIT_TEST_PASSWORD = randomBytes(24).toString('hex');

class RecoveryTestServer extends CitrineOSServer {
  get channelManagerForTest(): RabbitMQChannelManager {
    if (!this._channelManager) throw new Error('Channel manager is not initialized');
    return this._channelManager;
  }

  get connectionManagerForTest(): RabbitMQConnectionManager {
    if (!this._connectionManager) throw new Error('Connection manager is not initialized');
    return this._connectionManager;
  }

  get routerForTest(): IMessageRouter {
    if (!this._router) throw new Error('Router is not initialized');
    return this._router;
  }
}

interface QueueDetails {
  name: string;
  messages: number;
  messages_ready: number;
  messages_unacknowledged: number;
  consumers: number;
}

interface QueueBinding {
  source: string;
  destination: string;
  routing_key: string;
  arguments: Record<string, unknown>;
}

interface BrokerSnapshot {
  connectionNames: string[];
  channelCount: number;
  channels: string[];
  queueNames: string[];
  consumerCount: number;
  consumerQueues: string[];
  consumers: string[];
  messages: number;
  messagesReady: number;
  messagesUnacknowledged: number;
  rabbitRestartCount: number;
  rabbitStartedAt: string;
  nodeUptime: number;
}

interface PendingCall {
  resolve: (frame: unknown[]) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

class SimulatedStation {
  private readonly pending = new Map<string, PendingCall>();
  private readonly serverCalls: Array<{ id: string; action: string; payload: unknown }> = [];
  private readonly serverCallWaiters: Array<{
    action: string;
    resolve: (call: { id: string; action: string; payload: unknown }) => void;
    timeout: NodeJS.Timeout;
  }> = [];

  private constructor(
    readonly websocket: WebSocket,
    readonly stationId: string,
    readonly protocol: typeof OCPPVersion.OCPP1_6 | typeof OCPPVersion.OCPP2_0_1,
  ) {
    websocket.on('message', (raw: WebSocket.RawData) => this.onMessage(raw.toString()));
  }

  static async connect(
    port: number,
    stationId: string,
    protocol: typeof OCPPVersion.OCPP1_6 | typeof OCPPVersion.OCPP2_0_1,
  ): Promise<SimulatedStation> {
    const websocket = new WebSocket(`ws://127.0.0.1:${port}/${stationId}`, [protocol]);
    await new Promise<void>((resolve, reject) => {
      websocket.once('open', resolve);
      websocket.once('error', reject);
    });
    return new SimulatedStation(websocket, stationId, protocol);
  }

  async call(action: string, payload: object): Promise<unknown[]> {
    const id = crypto.randomUUID();
    const response = new Promise<unknown[]>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${this.protocol} ${action} received no CALLRESULT within 10 seconds`));
      }, 10_000);
      this.pending.set(id, { resolve, reject, timeout });
    });
    this.websocket.send(JSON.stringify([2, id, action, payload]));
    return response;
  }

  waitForServerCall(action: string): Promise<{ id: string; action: string; payload: unknown }> {
    const existingIndex = this.serverCalls.findIndex((call) => call.action === action);
    if (existingIndex >= 0) return Promise.resolve(this.serverCalls.splice(existingIndex, 1)[0]);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.serverCallWaiters.findIndex((waiter) => waiter.resolve === resolve);
        if (index >= 0) this.serverCallWaiters.splice(index, 1);
        reject(new Error(`No CSMS ${action} CALL reached ${this.stationId} within 5 seconds`));
      }, 5_000);
      this.serverCallWaiters.push({ action, resolve, timeout });
    });
  }

  close(): void {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Station socket closed'));
    }
    for (const waiter of this.serverCallWaiters) clearTimeout(waiter.timeout);
    this.websocket.close();
  }

  private onMessage(raw: string): void {
    const frame = JSON.parse(raw) as unknown[];
    if (frame[0] === 2) {
      const id = String(frame[1]);
      const action = String(frame[2]);
      const payload = frame[3];
      const call = { id, action, payload };
      const waiterIndex = this.serverCallWaiters.findIndex((waiter) => waiter.action === action);
      if (waiterIndex >= 0) {
        const [waiter] = this.serverCallWaiters.splice(waiterIndex, 1);
        clearTimeout(waiter.timeout);
        waiter.resolve(call);
      } else {
        this.serverCalls.push(call);
      }
      const accepted =
        this.protocol === OCPPVersion.OCPP1_6
          ? { status: 'Accepted' satisfies OCPP1_6.TriggerMessageResponse['status'] }
          : { status: 'Accepted' satisfies OCPP2_0_1.TriggerMessageResponse['status'] };
      this.websocket.send(JSON.stringify([3, id, accepted]));
      return;
    }
    if (frame[0] === 3 || frame[0] === 4) {
      const id = String(frame[1]);
      const pending = this.pending.get(id);
      if (!pending) return;
      clearTimeout(pending.timeout);
      this.pending.delete(id);
      if (frame[0] === 4)
        pending.reject(new Error(`Station CALL failed: ${JSON.stringify(frame)}`));
      else pending.resolve(frame);
    }
  }
}

async function reserveFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const port = (probe.address() as AddressInfo).port;
      probe.close(() => resolve(port));
    });
  });
}

let pgContainer: StartedTestContainer;
let rabbitContainer: StartedTestContainer;
let databasePort: number;
let rabbitPort: number;
let httpPort: number;
let websocketPort: number;
let tempDir: string;
let server: RecoveryTestServer;
let station16: SimulatedStation;
let station201: SimulatedStation;
let originalEnvironment: NodeJS.ProcessEnv;
let originalConsoleDebug: typeof console.debug;
let rabbitUptimeAtStart: number;

async function rabbitRequest<T>(path: string): Promise<T> {
  const auth = `Basic ${Buffer.from(`${RABBIT_TEST_USER}:${RABBIT_TEST_PASSWORD}`).toString('base64')}`;
  const response = await fetch(`http://127.0.0.1:${rabbitPort}${path}`, {
    headers: { Authorization: auth },
  });
  if (!response.ok) throw new Error(`RabbitMQ management API returned ${response.status}`);
  return response.json() as Promise<T>;
}

async function waitForRouterTopology(timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let last = 'queue not found';
  while (Date.now() < deadline) {
    const queue = await rabbitRequest<QueueDetails | null>(
      `/api/queues/%2F/${encodeURIComponent(ROUTER_QUEUE)}`,
    ).catch(() => null);
    const bindings = queue
      ? await rabbitRequest<QueueBinding[]>(
          `/api/queues/%2F/${encodeURIComponent(ROUTER_QUEUE)}/bindings`,
        )
      : [];
    const channel = await server.channelManagerForTest
      .getChannel('router-recovery-observer')
      .catch(() => undefined);
    const consumers = queue && channel ? await channel.checkQueue(ROUTER_QUEUE) : undefined;
    const bindingCount = bindings.filter((binding) => binding.source === EXCHANGE).length;
    last = `queue=${Boolean(queue)}, bindings=${bindingCount}, consumers=${consumers?.consumerCount ?? 0}`;
    if (queue && bindingCount === 4 && consumers?.consumerCount === 1) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Router queue was not restored exactly once: ${last}`);
}

async function waitForModuleTopology(
  expectedBindings: QueueBinding[],
  timeoutMs = 10_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let last = 'module queue not restored';
  while (Date.now() < deadline) {
    const [queue, bindings] = await Promise.all([
      rabbitRequest<QueueDetails | null>(
        `/api/queues/%2F/${encodeURIComponent(TRANSACTIONS_QUEUE)}`,
      ).catch(() => null),
      rabbitRequest<QueueBinding[]>(
        `/api/queues/%2F/${encodeURIComponent(TRANSACTIONS_QUEUE)}/bindings`,
      ).catch(() => []),
    ]);
    const actualBindings = bindings.filter((binding) => binding.source === EXCHANGE);
    last = `queue consumers=${queue?.consumers ?? 0}, bindings=${actualBindings.length}`;
    if (
      queue?.consumers === 1 &&
      queue.consumer_details?.length === 1 &&
      JSON.stringify(actualBindings) === JSON.stringify(expectedBindings)
    ) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Transaction module topology was not restored exactly once: ${last}`);
}

async function brokerSnapshot(): Promise<BrokerSnapshot> {
  const [connections, channels, queues, consumers, nodes] = await Promise.all([
    rabbitRequest<Array<{ name: string }>>('/api/connections'),
    rabbitRequest<
      Array<{ name: string; number: number; connection_name: string; consumer_count: number }>
    >('/api/channels'),
    rabbitRequest<QueueDetails[]>('/api/queues/%2F'),
    rabbitRequest<
      Array<{
        consumer_tag: string;
        queue: { name: string };
        channel_details: { name: string; number: number };
      }>
    >('/api/consumers/%2F'),
    rabbitRequest<Array<{ uptime: number }>>('/api/nodes'),
  ]);
  const dockerInfo = JSON.parse(
    execFileSync('docker', ['inspect', rabbitContainer.getId()], { encoding: 'utf8' }),
  )[0] as { RestartCount: number; State: { StartedAt: string } };
  return {
    connectionNames: connections.map(({ name }) => name).sort(),
    channelCount: channels.length,
    channels: channels
      .map(
        ({ connection_name, number, consumer_count }) =>
          `${connection_name}#${number}:${consumer_count}`,
      )
      .sort(),
    queueNames: queues.map(({ name }) => name).sort(),
    consumerCount: consumers.length,
    consumerQueues: consumers.map(({ queue }) => queue.name).sort(),
    consumers: consumers
      .map(
        ({ consumer_tag, queue, channel_details }) =>
          `${queue.name}:${consumer_tag}@${channel_details.name}#${channel_details.number}`,
      )
      .sort(),
    messages: queues.reduce((sum, queue) => sum + queue.messages, 0),
    messagesReady: queues.reduce((sum, queue) => sum + queue.messages_ready, 0),
    messagesUnacknowledged: queues.reduce((sum, queue) => sum + queue.messages_unacknowledged, 0),
    rabbitRestartCount: dockerInfo.RestartCount,
    rabbitStartedAt: dockerInfo.State.StartedAt,
    nodeUptime: nodes[0].uptime,
  };
}

async function waitForBrokerSnapshot(expected: BrokerSnapshot, timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let last: BrokerSnapshot | undefined;
  while (Date.now() < deadline) {
    last = await brokerSnapshot();
    if (
      JSON.stringify(last.connectionNames) === JSON.stringify(expected.connectionNames) &&
      last.channelCount === expected.channelCount &&
      JSON.stringify(last.queueNames) === JSON.stringify(expected.queueNames) &&
      last.consumerCount === expected.consumerCount &&
      JSON.stringify(last.consumerQueues) === JSON.stringify(expected.consumerQueues) &&
      last.messages === 0 &&
      last.messagesReady === 0 &&
      last.messagesUnacknowledged === 0 &&
      last.rabbitRestartCount === expected.rabbitRestartCount &&
      last.rabbitStartedAt === expected.rabbitStartedAt
    ) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(
    `RabbitMQ topology did not return to baseline within ${timeoutMs} ms: ` +
      `expected=${JSON.stringify(expected)}, actual=${JSON.stringify(last)}`,
  );
}

async function waitForHealthyBrokerBaseline(timeoutMs = 15_000): Promise<BrokerSnapshot> {
  const deadline = Date.now() + timeoutMs;
  let previousChannelCount = -1;
  let stableSamples = 0;
  let last: BrokerSnapshot | undefined;
  while (Date.now() < deadline) {
    last = await brokerSnapshot();
    const hasOneConsumerPerQueue =
      last.queueNames.length === last.consumerQueues.length &&
      JSON.stringify(last.queueNames) === JSON.stringify(last.consumerQueues) &&
      last.messages === 0 &&
      last.messagesReady === 0 &&
      last.messagesUnacknowledged === 0;
    if (last.connectionNames.length === 1 && hasOneConsumerPerQueue) {
      stableSamples = last.channelCount === previousChannelCount ? stableSamples + 1 : 0;
      previousChannelCount = last.channelCount;
      if (stableSamples >= 2) return last;
    } else {
      previousChannelCount = last.channelCount;
      stableSamples = 0;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(
    `RabbitMQ did not reach a stable one-consumer-per-queue baseline within ${timeoutMs} ms: ` +
      JSON.stringify(last),
  );
}

function buildTestEnvironment(): NodeJS.ProcessEnv {
  return {
    ...originalEnvironment,
    APP_NAME: 'all',
    CITRINEOS_HOST: '127.0.0.1',
    CITRINEOS_PORT: String(httpPort),
    CITRINEOS_LOGLEVEL: '4',
    CITRINEOS_SWAGGER_ENABLED: 'false',
    CITRINEOS_DATABASE_HOST: '127.0.0.1',
    CITRINEOS_DATABASE_PORT: String(databasePort),
    CITRINEOS_DATABASE_DATABASE: 'postgres',
    CITRINEOS_DATABASE_USERNAME: 'postgres',
    CITRINEOS_DATABASE_PASSWORD: 'postgres',
    CITRINEOS_FILEACCESS_TYPE: 'local',
    CITRINEOS_FILEACCESS_LOCAL_DEFAULTFILEPATH: tempDir,
    CITRINEOS_MESSAGEBROKER_AMQP_URL: `amqp://${RABBIT_TEST_USER}:${RABBIT_TEST_PASSWORD}@127.0.0.1:${rabbitPort}`,
    CITRINEOS_MESSAGEBROKER_AMQP_INSTANCEIDENTIFIER: INSTANCE,
  };
}

function status16(connectorId: number): OCPP1_6.StatusNotificationRequest {
  return {
    connectorId,
    errorCode: 'NoError',
    status: 'Available',
    timestamp: new Date().toISOString(),
  };
}

function status201(evseId: number): OCPP2_0_1.StatusNotificationRequest {
  return {
    timestamp: new Date().toISOString(),
    connectorStatus: 'Available',
    evseId,
    connectorId: 1,
  };
}

describe('CitrineOS channel-only recovery with OCPP stations', () => {
  beforeAll(async () => {
    originalEnvironment = { ...process.env };
    originalConsoleDebug = console.debug;
    console.debug = (...args: unknown[]) =>
      originalConsoleDebug(
        ...args.map((arg) =>
          typeof arg === 'string' ? arg.replace(/amqp:\/\/[^@\s]+@/g, 'amqp://[redacted]@') : arg,
        ),
      );
    [pgContainer, rabbitContainer] = await Promise.all([
      new GenericContainer('postgis/postgis:16-3.5')
        .withEnvironment({
          POSTGRES_USER: 'postgres',
          POSTGRES_PASSWORD: 'postgres',
          POSTGRES_DB: 'postgres',
        })
        .withExposedPorts(5432)
        .withWaitStrategy(Wait.forLogMessage('ready to accept connections', 2))
        .start(),
      new GenericContainer('rabbitmq:3-management-alpine')
        .withEnvironment({
          RABBITMQ_DEFAULT_USER: RABBIT_TEST_USER,
          RABBITMQ_DEFAULT_PASS: RABBIT_TEST_PASSWORD,
        })
        .withExposedPorts(5672, 15672)
        .withWaitStrategy(Wait.forLogMessage('Server startup complete', 1))
        .start(),
    ]);

    databasePort = pgContainer.getMappedPort(5432);
    rabbitPort = rabbitContainer.getMappedPort(15672);
    const amqpPort = rabbitContainer.getMappedPort(5672);
    [httpPort, websocketPort] = await Promise.all([reserveFreePort(), reserveFreePort()]);
    tempDir = mkdtempSync(join(tmpdir(), 'citrineos-channel-recovery-'));
    writeFileSync(
      join(tempDir, 'websocket-servers.json'),
      JSON.stringify(
        [
          {
            id: 'channel-recovery-test',
            host: '127.0.0.1',
            port: websocketPort,
            pingInterval: 60,
            protocols: [OCPPVersion.OCPP1_6, OCPPVersion.OCPP2_0_1],
            securityProfile: 0,
            allowUnknownChargingStations: true,
            tenantId: 1,
          },
        ],
        null,
        2,
      ),
    );

    const testEnvironment = buildTestEnvironment();
    testEnvironment.CITRINEOS_MESSAGEBROKER_AMQP_URL = `amqp://${RABBIT_TEST_USER}:${RABBIT_TEST_PASSWORD}@127.0.0.1:${amqpPort}`;
    execSync('pnpm run db:migrate', {
      cwd: SERVER_ROOT,
      env: testEnvironment,
      stdio: 'pipe',
      maxBuffer: 32 * 1024 * 1024,
    });

    const seedResult = await pgContainer.exec([
      'psql',
      '-U',
      'postgres',
      '-d',
      'postgres',
      '-c',
      `INSERT INTO "ChargingStations" ("ocppConnectionName", "isOnline", "createdAt", "updatedAt", "tenantId")
       VALUES ('CHANNEL-RECOVERY-OCPP16', false, now(), now(), 1), ('CHANNEL-RECOVERY-OCPP201', false, now(), now(), 1)
       ON CONFLICT DO NOTHING`,
    ]);
    expect(seedResult.exitCode).toBe(0);

    process.env = testEnvironment;
    const config = await ConfigLoader.loadConfig();
    server = new RecoveryTestServer('all', config);
    await server.run();
    const health = await fetch(`http://127.0.0.1:${httpPort}/health/ready`);
    expect(health.ok).toBe(true);
    const nodes = await rabbitRequest<Array<{ uptime: number }>>('/api/nodes');
    expect(nodes.length).toBe(1);
    rabbitUptimeAtStart = nodes[0].uptime;
  }, 180_000);

  afterAll(async () => {
    station16?.close();
    station201?.close();
    if (server) {
      await server.shutdown();
      await server.connectionManagerForTest.close();
    }
    process.env = originalEnvironment;
    console.debug = originalConsoleDebug;
    await Promise.allSettled([pgContainer?.stop(), rabbitContainer?.stop()]);
  }, 40_000);

  it('keeps both protocol flows alive through ten module and router channel-only failures', async () => {
    station16 = await SimulatedStation.connect(
      websocketPort,
      'CHANNEL-RECOVERY-OCPP16',
      OCPPVersion.OCPP1_6,
    );
    station201 = await SimulatedStation.connect(
      websocketPort,
      'CHANNEL-RECOVERY-OCPP201',
      OCPPVersion.OCPP2_0_1,
    );

    const boot16 = await station16.call(OCPP_CallAction.BootNotification, {
      chargePointVendor: 'CitrineOS Test',
      chargePointModel: 'Channel-Recovery-16',
    });
    expect(boot16[0]).toBe(3);
    expect(boot16[2]).toMatchObject({ status: 'Accepted' });

    const boot201 = await station201.call(OCPP_CallAction.BootNotification, {
      reason: 'PowerUp',
      chargingStation: { model: 'Channel-Recovery-201', vendorName: 'CitrineOS Test' },
    });
    expect(boot201[0]).toBe(3);
    expect(boot201[2]).toMatchObject({ status: 'Accepted' });
    await waitForRouterTopology();

    const manager = server.connectionManagerForTest;
    const originalConnection = await manager.connect();
    let connectedEvents = 0;
    let disconnectedEvents = 0;
    manager.on('connected', () => connectedEvents++);
    manager.on('disconnected', () => disconnectedEvents++);
    const processId = process.pid;
    const brokerBaseline = await waitForHealthyBrokerBaseline();
    const moduleBindings = (
      await rabbitRequest<QueueBinding[]>(
        `/api/queues/%2F/${encodeURIComponent(TRANSACTIONS_QUEUE)}/bindings`,
      )
    ).filter((binding) => binding.source === EXCHANGE);
    expect(moduleBindings.length).toBeGreaterThan(0);
    console.log(`[channel-recovery-e2e] broker baseline: ${JSON.stringify(brokerBaseline)}`);

    for (let cycle = 1; cycle <= 10; cycle++) {
      const channelA = await server.channelManagerForTest.getChannel(TRANSACTIONS_CHANNEL);
      await expect(
        channelA.checkQueue(`channel-recovery-missing-transactions-${cycle}`),
      ).rejects.toMatchObject({ code: 404 });
      expect(manager.isConnected()).toBe(true);
      const channelB = await server.channelManagerForTest.getChannel(TRANSACTIONS_CHANNEL);
      expect(channelB).not.toBe(channelA);
      const routerChannelA = await server.channelManagerForTest.getChannel('router-receiver');
      await expect(
        routerChannelA.checkQueue(`channel-recovery-missing-router-${cycle}`),
      ).rejects.toMatchObject({ code: 404 });
      const routerChannelB = await server.channelManagerForTest.getChannel('router-receiver');
      expect(routerChannelB).not.toBe(routerChannelA);
      expect(await manager.connect()).toBe(originalConnection);
      expect(connectedEvents).toBe(0);
      expect(disconnectedEvents).toBe(0);
      expect(process.pid).toBe(processId);
      await waitForRouterTopology();
      await waitForModuleTopology(moduleBindings);
      await waitForBrokerSnapshot(brokerBaseline);
      const recoveredBroker = await brokerSnapshot();
      expect(recoveredBroker.connectionNames).toEqual(brokerBaseline.connectionNames);
      expect(recoveredBroker.channelCount).toBe(brokerBaseline.channelCount);
      expect(recoveredBroker.queueNames).toEqual(brokerBaseline.queueNames);
      expect(recoveredBroker.consumerCount).toBe(brokerBaseline.consumerCount);
      expect(recoveredBroker.nodeUptime).toBeGreaterThanOrEqual(brokerBaseline.nodeUptime);

      const connector1 = await station16.call(OCPP_CallAction.StatusNotification, status16(1));
      const connector2 = await station16.call(OCPP_CallAction.StatusNotification, status16(2));
      const evse1 = await station201.call(OCPP_CallAction.StatusNotification, status201(1));
      const evse2 = await station201.call(OCPP_CallAction.StatusNotification, status201(2));
      expect([connector1[0], connector2[0], evse1[0], evse2[0]]).toEqual([3, 3, 3, 3]);

      const pending16 = station16.waitForServerCall(OCPP_CallAction.TriggerMessage);
      const pending201 = station201.waitForServerCall(OCPP_CallAction.TriggerMessage);
      const [sent16, sent201] = await Promise.all([
        server.routerForTest.sendCall(
          station16.stationId,
          1,
          OCPPVersion.OCPP1_6,
          OCPP_CallAction.TriggerMessage,
          { requestedMessage: 'Heartbeat' } as OCPP1_6.TriggerMessageRequest,
          `channel-recovery-16-${cycle}`,
        ),
        server.routerForTest.sendCall(
          station201.stationId,
          1,
          OCPPVersion.OCPP2_0_1,
          OCPP_CallAction.TriggerMessage,
          { requestedMessage: 'Heartbeat' } as OCPP2_0_1.TriggerMessageRequest,
          `channel-recovery-201-${cycle}`,
        ),
      ]);
      expect(sent16.success).toBe(true);
      expect(sent201.success).toBe(true);
      const [call16, call201] = await Promise.all([pending16, pending201]);
      expect(call16.action).toBe(OCPP_CallAction.TriggerMessage);
      expect(call201.action).toBe(OCPP_CallAction.TriggerMessage);
      const bindings = await rabbitRequest<QueueBinding[]>(
        `/api/queues/%2F/${encodeURIComponent(ROUTER_QUEUE)}/bindings`,
      );
      expect(bindings.filter((binding) => binding.source === EXCHANGE)).toHaveLength(4);
    }

    expect(connectedEvents).toBe(0);
    expect(disconnectedEvents).toBe(0);
    expect(process.pid).toBe(processId);
    const brokerFinal = await waitForBrokerSnapshot(brokerBaseline).then(() => brokerSnapshot());
    console.log(
      `[channel-recovery-e2e] broker after 10 channel failures: ${JSON.stringify(brokerFinal)}`,
    );
    const nodes = await rabbitRequest<Array<{ uptime: number }>>('/api/nodes');
    expect(nodes[0].uptime).toBeGreaterThanOrEqual(rabbitUptimeAtStart);
  }, 180_000);
});
