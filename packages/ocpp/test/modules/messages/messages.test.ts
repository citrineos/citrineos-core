// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  MessagesDeadLetterConsumer,
  MessagesEventConsumer,
  MessagesEventPipeline,
} from '@/transport/index.js';
import { MessagesModule } from '@modules/messages/messages.js';
import type { WebhookDispatcher } from '@modules/messages/webhook-dispatcher.js';
import { aConnectionEvent, aFrameEvent } from '@test/providers/messages-event-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('MessagesModule', () => {
  const { container, logger } = createTestContainer();
  let consumer: {
    start: ReturnType<typeof vi.fn>;
    shutdown: ReturnType<typeof vi.fn>;
    consumedQueues: string[];
  };
  let deadLetterConsumer: {
    start: ReturnType<typeof vi.fn>;
    shutdown: ReturnType<typeof vi.fn>;
    consumedQueues: string[];
  };
  let pipeline: {
    run: ReturnType<typeof vi.fn>;
    processorNames: { frame: string[]; connection: string[] };
  };
  let webhookDispatcher: { shutdown: ReturnType<typeof vi.fn> };

  function buildModule(): MessagesModule {
    return getTestInstance(container, MessagesModule, {
      messagesEventConsumer: consumer as unknown as MessagesEventConsumer,
      messagesDeadLetterConsumer: deadLetterConsumer as unknown as MessagesDeadLetterConsumer,
      messagesEventPipeline: pipeline as unknown as MessagesEventPipeline,
      webhookDispatcher: webhookDispatcher as unknown as WebhookDispatcher,
    });
  }

  function registeredHandler(): (event: any) => Promise<void> {
    return consumer.start.mock.calls[0][0];
  }

  beforeEach(() => {
    vi.clearAllMocks();
    consumer = {
      start: vi.fn().mockResolvedValue(undefined),
      shutdown: vi.fn().mockResolvedValue(undefined),
      consumedQueues: ['messages.ocpp', 'messages.connections'],
    };
    deadLetterConsumer = {
      start: vi.fn().mockResolvedValue(undefined),
      shutdown: vi.fn().mockResolvedValue(undefined),
      consumedQueues: ['messages.ocpp.dlq', 'messages.connections.dlq'],
    };
    pipeline = {
      run: vi.fn().mockResolvedValue({}),
      processorNames: {
        frame: ['ocpp-message-persist', 'frame-webhook'],
        connection: ['connection-webhook'],
      },
    };
    webhookDispatcher = { shutdown: vi.fn() };
  });

  // ─── start ─────────────────────────────────────────────────────────────────

  describe('start', () => {
    it('should start consuming with the pipeline as the handler', async () => {
      await buildModule().start();

      expect(consumer.start).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should route every consumed event through the pipeline', async () => {
      await buildModule().start();
      const handler = registeredHandler();

      await handler(aFrameEvent());
      await handler(aConnectionEvent());

      expect(pipeline.run).toHaveBeenCalledTimes(2);
      expect(pipeline.run.mock.calls.map(([event]) => event.kind)).toEqual(['frame', 'connection']);
    });

    it('should resolve the handler to void, so the context never reaches the transport', async () => {
      pipeline.run.mockResolvedValue({ persistedId: 1 });
      await buildModule().start();

      await expect(registeredHandler()(aFrameEvent())).resolves.toBeUndefined();
    });

    it('should let a pipeline failure reach the transport, which decides on retry', async () => {
      pipeline.run.mockRejectedValue(new Error('database down'));
      await buildModule().start();

      await expect(registeredHandler()(aFrameEvent())).rejects.toThrow('database down');
    });

    it('should warn when it was started with no processors at all', async () => {
      pipeline.processorNames = { frame: [], connection: [] };

      await buildModule().start();

      expect(logger.warn).toHaveBeenCalled();
    });

    it('should not warn when at least one kind is served', async () => {
      pipeline.processorNames = { frame: [], connection: ['connection-webhook'] };

      await buildModule().start();

      expect(logger.warn).not.toHaveBeenCalled();
    });
  });

  // ─── shutdown ──────────────────────────────────────────────────────────────

  describe('dead-letter reporting', () => {
    it('should start draining the dead-letter queues', async () => {
      await buildModule().start();

      expect(deadLetterConsumer.start).toHaveBeenCalled();
    });

    it('should serve live traffic even when dead-letter reporting cannot start', async () => {
      deadLetterConsumer.start.mockRejectedValue(new Error('dlq locked'));

      await expect(buildModule().start()).resolves.toBeUndefined();

      expect(consumer.start).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should stop both consumers before releasing the dispatchers refresh timer', async () => {
      const order: string[] = [];
      consumer.shutdown.mockImplementation(async () => void order.push('consumer'));
      deadLetterConsumer.shutdown.mockImplementation(async () => void order.push('dead-letter'));
      webhookDispatcher.shutdown.mockImplementation(() => void order.push('dispatcher'));

      await buildModule().shutdown();

      expect(order).toEqual(['consumer', 'dead-letter', 'dispatcher']);
    });
  });
});
