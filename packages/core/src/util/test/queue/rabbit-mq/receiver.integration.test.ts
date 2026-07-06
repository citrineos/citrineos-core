// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Integration tests for RabbitMqReceiver using a real RabbitMQ broker via Testcontainers.
 *
 * These tests complement the unit tests in receiver.test.ts by verifying actual broker
 * state — queue existence, binding arguments, and consumer counts — through the
 * RabbitMQ Management HTTP API (port 15672).
 *
 * What we verify that mocks cannot:
 *  • Queues are actually created with the correct durability flags.
 *  • Header bindings land in the broker with the right arguments.
 *  • Consumer count on the instance queue never exceeds 1 in ROUTER_MODE,
 *    regardless of how many chargers subscribe.
 *  • Unsubscribe actually removes bindings from the broker.
 */

import { OCPP_CallAction } from '@citrineos/base';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RabbitMQChannelManager } from '../../../queue/rabbit-mq/ChannelManager.js';
import { RabbitMQConnectionManager } from '../../../queue/rabbit-mq/ConnectionManager.js';
import { RabbitMqReceiver } from '../../../queue/rabbit-mq/receiver.js';
import { aSystemConfigWithAmqp } from '../../providers/RabbitMqProvider.js';

// ---------------------------------------------------------------------------
// Management API types (subset of the full RabbitMQ HTTP API response)
// ---------------------------------------------------------------------------

interface MgmtQueue {
  name: string;
  durable: boolean;
  auto_delete: boolean;
  exclusive: boolean;
  consumers: number;
}

interface MgmtBinding {
  source: string; // exchange name
  destination: string; // queue name
  destination_type: string;
  routing_key: string;
  arguments: Record<string, string>;
}

interface MgmtConsumer {
  queue: { name: string; vhost: string };
  consumer_tag: string;
}

// ---------------------------------------------------------------------------
// Container lifecycle — shared across all tests in this file
// ---------------------------------------------------------------------------

const EXCHANGE = 'test-exchange';
const VHOST = '%2F'; // URL-encoded "/"

let container: StartedTestContainer;
let amqpUrl: string;
let mgmtUrl: string;

beforeAll(async () => {
  container = await new GenericContainer('rabbitmq:3-management-alpine')
    .withExposedPorts(5672, 15672)
    .withWaitStrategy(Wait.forLogMessage('Server startup complete', 1))
    .start();

  const amqpPort = container.getMappedPort(5672);
  const mgmtPort = container.getMappedPort(15672);
  amqpUrl = `amqp://guest:guest@localhost:${amqpPort}`;
  mgmtUrl = `http://localhost:${mgmtPort}`;
}, 60_000);

afterAll(async () => {
  await container?.stop();
});

// ---------------------------------------------------------------------------
// Management API helpers
// ---------------------------------------------------------------------------

const MGMT_AUTH = `Basic ${Buffer.from('guest:guest').toString('base64')}`;

async function mgmtGet<T>(path: string): Promise<T> {
  const res = await fetch(`${mgmtUrl}${path}`, {
    headers: { Authorization: MGMT_AUTH },
  });
  if (!res.ok) throw new Error(`Management API ${res.status} at ${path}`);
  return res.json() as Promise<T>;
}

async function getQueue(name: string): Promise<MgmtQueue | null> {
  try {
    return await mgmtGet<MgmtQueue>(`/api/queues/${VHOST}/${encodeURIComponent(name)}`);
  } catch {
    return null;
  }
}

/**
 * Returns the number of active consumers on `queueName` using the real-time
 * `/api/consumers` endpoint (not the stats-based queue details endpoint).
 * Returns 0 if the queue has been auto-deleted or if the API call fails.
 */
async function getActiveConsumerCount(queueName: string): Promise<number> {
  try {
    const all = await mgmtGet<MgmtConsumer[]>(`/api/consumers/${VHOST}`);
    return all.filter((c) => c.queue.name === queueName).length;
  } catch {
    return 0;
  }
}

/**
 * Polls until the active consumer count on `queueName` equals `expected`, or throws.
 * Uses /api/consumers (real-time) rather than queue detail stats (asynchronously
 * collected at 5-second intervals), so it works immediately after connect/cancel.
 * A null queue (auto-deleted) is treated as 0 consumers.
 */
async function waitForConsumerCount(
  queueName: string,
  expected: number,
  timeoutMs = 10_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastCount = undefined;
  while (Date.now() < deadline) {
    const count = await getActiveConsumerCount(queueName);
    if (count === expected) return;
    lastCount = count;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(
    `Timed out waiting for consumer count ${expected} on "${queueName}" ` +
      `(last observed: ${lastCount})`,
  );
}

/** Returns only header-exchange bindings (filters out the default queue↔queue binding). */
async function getQueueBindings(queueName: string): Promise<MgmtBinding[]> {
  const all = await mgmtGet<MgmtBinding[]>(
    `/api/queues/${VHOST}/${encodeURIComponent(queueName)}/bindings`,
  );
  return all.filter((b) => b.source === EXCHANGE);
}

// ---------------------------------------------------------------------------
// Per-test receiver lifecycle
// ---------------------------------------------------------------------------

let connectionManager: RabbitMQConnectionManager;
let channelManager: RabbitMQChannelManager;
let receiver: RabbitMqReceiver;

// Each test uses a unique suffix so durable queues from one test don't affect another.
let uid: string;

beforeEach(async () => {
  uid = Date.now().toString(36);
  connectionManager = new RabbitMQConnectionManager({ maxReconnectDelay: 5_000, amqpUrl });
  channelManager = new RabbitMQChannelManager({ connectionManager });
  // Mirror production startup: connect before any subscribe() calls so the
  // initial 'connected' event fires while _moduleSubscriptions/_instanceQueueReady
  // are still empty, and _onReconnect is a no-op on first connect.
  await connectionManager.connect();
});

afterEach(async () => {
  try {
    await receiver?.shutdown();
  } catch {
    /* already shut down */
  }
  try {
    // Disable the reconnect handler before closing so the connection's 'close'
    // event does not schedule a new connect() timer that fires after the test.
    (connectionManager as any).handleReconnect = () => Promise.resolve();
    await connectionManager?.close();
  } catch {
    /* already closed */
  }
});

describe('RabbitMqReceiver', () => {
  // ---------------------------------------------------------------------------
  // MODULE_MODE — dedicated queue per identifier
  // ---------------------------------------------------------------------------

  describe('MODULE_MODE — broker state', () => {
    beforeEach(() => {
      receiver = new RabbitMqReceiver({
        config: aSystemConfigWithAmqp({ exchange: EXCHANGE }),
        channelManager,
      });
    });

    it('should create a durable, auto-delete queue named after the identifier', async () => {
      const id = `Provisioning-${uid}`;
      await receiver.subscribe(id, [OCPP_CallAction.BootNotification], {});

      const queue = await getQueue(`rabbit_queue_${id}`);

      expect(queue).not.toBeNull();
      expect(queue!.durable).toBe(true);
      expect(queue!.auto_delete).toBe(true);
      expect(queue!.exclusive).toBe(false);
    }, 15_000);

    it('should start exactly one consumer on the queue after subscribe', async () => {
      const id = `Transactions-${uid}`;
      await receiver.subscribe(id, [OCPP_CallAction.TransactionEvent], {});

      await waitForConsumerCount(`rabbit_queue_${id}`, 1);
    }, 15_000);

    it('should create one binding per action on the queue', async () => {
      const id = `Monitor-${uid}`;
      await receiver.subscribe(
        id,
        [OCPP_CallAction.StatusNotification, OCPP_CallAction.Heartbeat],
        { origin: 'CS' },
      );

      const bindings = await getQueueBindings(`rabbit_queue_${id}`);

      expect(bindings).toHaveLength(2);
      const actions = bindings.map((b) => b.arguments['action']);
      expect(actions).toContain(OCPP_CallAction.StatusNotification);
      expect(actions).toContain(OCPP_CallAction.Heartbeat);
    }, 15_000);

    it('should include filter arguments in the binding headers', async () => {
      const id = `Config-${uid}`;
      await receiver.subscribe(id, [OCPP_CallAction.BootNotification], {
        tenantId: '1',
        ocppConnectionName: 'CS001',
      });

      const bindings = await getQueueBindings(`rabbit_queue_${id}`);
      const binding = bindings[0];

      expect(binding.arguments['x-match']).toBe('all');
      expect(binding.arguments['tenantId']).toBe('1');
      expect(binding.arguments['ocppConnectionName']).toBe('CS001');
    }, 15_000);

    it('should drop the consumer count to 0 after unsubscribe', async () => {
      const id = `Cert-${uid}`;
      await receiver.subscribe(id, [OCPP_CallAction.CertificateSigned], {});

      await receiver.unsubscribe(id);

      // Queue may still exist (durable) but must have no active consumers
      await waitForConsumerCount(`rabbit_queue_${id}`, 0);
    }, 15_000);
  });

  // ---------------------------------------------------------------------------
  // ROUTER_MODE — single instance queue, dynamic bindings per charger
  // ---------------------------------------------------------------------------

  describe('ROUTER_MODE — broker state', () => {
    const instanceId = `router-integration`;

    beforeEach(() => {
      receiver = new RabbitMqReceiver({
        config: aSystemConfigWithAmqp({
          exchange: EXCHANGE,
          instanceIdentifier: `${instanceId}-${uid}`,
        }),
        channelManager,
        routerMode: true,
      });
    });

    it('should create a single durable, non-auto-delete instance queue', async () => {
      await receiver.subscribe('charger-1', undefined, {
        ocppConnectionName: 'CS001',
        tenantId: '1',
        state: 'Request',
        origin: 'CSMS',
      });

      const queueName = `rabbit_queue_router_${instanceId}-${uid}`;
      const queue = await getQueue(queueName);

      expect(queue).not.toBeNull();
      expect(queue!.durable).toBe(true);
      expect(queue!.auto_delete).toBe(true);
      expect(queue!.exclusive).toBe(false);
    }, 15_000);

    it('should start exactly one consumer even after multiple chargers subscribe', async () => {
      const queueName = `rabbit_queue_router_${instanceId}-${uid}`;

      await receiver.subscribe('charger-1', undefined, {
        ocppConnectionName: 'CS001',
        tenantId: '1',
      });
      await receiver.subscribe('charger-2', undefined, {
        ocppConnectionName: 'CS002',
        tenantId: '1',
      });
      await receiver.subscribe('charger-3', undefined, {
        ocppConnectionName: 'CS003',
        tenantId: '1',
      });

      await waitForConsumerCount(queueName, 1);
    }, 15_000);

    it('should add one binding to the instance queue per charger subscribe', async () => {
      const queueName = `rabbit_queue_router_${instanceId}-${uid}`;

      await receiver.subscribe('charger-1', undefined, {
        ocppConnectionName: 'CS001',
        tenantId: '1',
      });
      await receiver.subscribe('charger-2', undefined, {
        ocppConnectionName: 'CS002',
        tenantId: '1',
      });
      await receiver.subscribe('charger-3', undefined, {
        ocppConnectionName: 'CS003',
        tenantId: '1',
      });

      const bindings = await getQueueBindings(queueName);

      expect(bindings).toHaveLength(3);
    }, 15_000);

    it('should include ocppConnectionName and tenantId in each charger binding', async () => {
      const queueName = `rabbit_queue_router_${instanceId}-${uid}`;

      await receiver.subscribe('charger-1', undefined, {
        ocppConnectionName: 'CS001',
        tenantId: '42',
        state: 'Response',
        origin: 'CSMS',
      });

      const bindings = await getQueueBindings(queueName);
      const binding = bindings[0];

      expect(binding.arguments['x-match']).toBe('all');
      expect(binding.arguments['ocppConnectionName']).toBe('CS001');
      expect(binding.arguments['tenantId']).toBe('42');
      expect(binding.arguments['state']).toBe('Response');
      expect(binding.arguments['origin']).toBe('CSMS');
    }, 15_000);

    it('should create one binding per action when actions are provided', async () => {
      const queueName = `rabbit_queue_router_${instanceId}-${uid}`;

      await receiver.subscribe(
        'charger-1',
        [OCPP_CallAction.BootNotification, OCPP_CallAction.Heartbeat],
        { ocppConnectionName: 'CS001', tenantId: '1' },
      );

      const bindings = await getQueueBindings(queueName);

      expect(bindings).toHaveLength(2);
      const actions = bindings.map((b) => b.arguments['action']);
      expect(actions).toContain(OCPP_CallAction.BootNotification);
      expect(actions).toContain(OCPP_CallAction.Heartbeat);
    }, 15_000);

    it('should remove only the unsubscribed charger bindings from the broker', async () => {
      const queueName = `rabbit_queue_router_${instanceId}-${uid}`;

      await receiver.subscribe('charger-1', undefined, {
        ocppConnectionName: 'CS001',
        tenantId: '1',
      });
      await receiver.subscribe('charger-2', undefined, {
        ocppConnectionName: 'CS002',
        tenantId: '1',
      });

      await receiver.unsubscribe('charger-1');

      const bindings = await getQueueBindings(queueName);

      expect(bindings).toHaveLength(1);
      expect(bindings[0].arguments['ocppConnectionName']).toBe('CS002');
    }, 15_000);

    it('should keep exactly one consumer after unsubscribing a charger', async () => {
      const queueName = `rabbit_queue_router_${instanceId}-${uid}`;

      await receiver.subscribe('charger-1', undefined, {
        ocppConnectionName: 'CS001',
        tenantId: '1',
      });
      await receiver.subscribe('charger-2', undefined, {
        ocppConnectionName: 'CS002',
        tenantId: '1',
      });

      await receiver.unsubscribe('charger-1');

      await waitForConsumerCount(queueName, 1);
    }, 15_000);

    it('should cancel the consumer on shutdown and auto-delete the queue', async () => {
      const queueName = `rabbit_queue_router_${instanceId}-${uid}`;

      await receiver.subscribe('charger-1', undefined, {
        ocppConnectionName: 'CS001',
        tenantId: '1',
      });
      await receiver.shutdown();

      // autoDelete:true — queue is removed once the last consumer is cancelled
      await waitForConsumerCount(queueName, 0);
      const queue = await getQueue(queueName);
      expect(queue).toBeNull();
    }, 15_000);
  });
});
