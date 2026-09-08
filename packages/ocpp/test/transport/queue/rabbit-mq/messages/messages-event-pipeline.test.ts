// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  IConnectionEventProcessor,
  IFrameEventProcessor,
  MessagesEvent,
  MessagesEventContext,
} from '@citrineos/types';
import { MessagesEventPipeline } from '@/transport/index.js';
import { aConnectionEvent, aFrameEvent } from '@test/providers/messages-event-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type SpyProcessor = {
  name: string;
  critical: boolean;
  process: ReturnType<typeof vi.fn>;
};

function aProcessor(
  name: string,
  critical = false,
  impl?: (event: MessagesEvent, context: MessagesEventContext) => Promise<void>,
): SpyProcessor {
  return {
    name,
    critical,
    process: impl ? vi.fn(impl) : vi.fn().mockResolvedValue(undefined),
  };
}

describe('MessagesEventPipeline', () => {
  const { container, logger } = createTestContainer();
  let frameEventProcessors: SpyProcessor[];
  let connectionEventProcessors: SpyProcessor[];

  function buildPipeline(): MessagesEventPipeline {
    return getTestInstance(container, MessagesEventPipeline, {
      frameEventProcessors: frameEventProcessors as unknown as IFrameEventProcessor[],
      connectionEventProcessors:
        connectionEventProcessors as unknown as IConnectionEventProcessor[],
    });
  }

  beforeEach(() => {
    frameEventProcessors = [aProcessor('frame-a'), aProcessor('frame-b')];
    connectionEventProcessors = [aProcessor('connection-a')];
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ─── dispatch by kind ──────────────────────────────────────────────────────

  describe('dispatch by kind', () => {
    it('should run only the frame processors for a frame event', async () => {
      const event = aFrameEvent();

      await buildPipeline().run(event);

      for (const processor of frameEventProcessors) {
        expect(processor.process).toHaveBeenCalledWith(event, expect.any(Object));
      }
      expect(connectionEventProcessors[0].process).not.toHaveBeenCalled();
    });

    it('should run only the connection processors for a connection event', async () => {
      const event = aConnectionEvent();

      await buildPipeline().run(event);

      expect(connectionEventProcessors[0].process).toHaveBeenCalledWith(event, expect.any(Object));
      for (const processor of frameEventProcessors) {
        expect(processor.process).not.toHaveBeenCalled();
      }
    });

    it('should run the frame processors in registration order', async () => {
      const order: string[] = [];
      frameEventProcessors = [
        aProcessor('first', false, async () => void order.push('first')),
        aProcessor('second', false, async () => void order.push('second')),
      ];

      await buildPipeline().run(aFrameEvent());

      expect(order).toEqual(['first', 'second']);
    });

    it('should await each processor before starting the next', async () => {
      const running: string[] = [];
      frameEventProcessors = [
        aProcessor('slow', false, async () => {
          running.push('slow:start');
          await new Promise((resolve) => setTimeout(resolve, 5));
          running.push('slow:end');
        }),
        aProcessor('fast', false, async () => void running.push('fast')),
      ];

      await buildPipeline().run(aFrameEvent());

      expect(running).toEqual(['slow:start', 'slow:end', 'fast']);
    });

    it('should do nothing but return a context when no processor serves the kind', async () => {
      connectionEventProcessors = [];

      await expect(buildPipeline().run(aConnectionEvent())).resolves.toEqual({});
    });
  });

  // ─── context ───────────────────────────────────────────────────────────────

  describe('context', () => {
    it('should carry what one processor wrote to the next', async () => {
      frameEventProcessors = [
        aProcessor('persist', true, async (_event, context) => {
          context.persistedAction = 'BootNotification';
          context.persistedId = 42;
        }),
        aProcessor('webhook'),
      ];

      const context = await buildPipeline().run(aFrameEvent());

      expect(frameEventProcessors[1].process).toHaveBeenCalledWith(expect.anything(), {
        persistedAction: 'BootNotification',
        persistedId: 42,
      });
      expect(context).toEqual({ persistedAction: 'BootNotification', persistedId: 42 });
    });

    it('should start each event with a fresh context', async () => {
      frameEventProcessors = [
        aProcessor('persist', true, async (_event, context) => {
          context.persistedId = (context.persistedId ?? 0) + 1;
        }),
      ];
      const pipeline = buildPipeline();

      await pipeline.run(aFrameEvent());
      const second = await pipeline.run(aFrameEvent());

      expect(second.persistedId).toBe(1);
    });
  });

  // ─── failure policy ────────────────────────────────────────────────────────

  describe('failure policy', () => {
    it('should rethrow a critical failure so the transport can retry and dead-letter', async () => {
      const boom = new Error('database down');
      frameEventProcessors = [aProcessor('persist', true, () => Promise.reject(boom))];

      await expect(buildPipeline().run(aFrameEvent())).rejects.toBe(boom);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should abandon the remaining processors once a critical one fails', async () => {
      frameEventProcessors = [
        aProcessor('persist', true, () => Promise.reject(new Error('database down'))),
        aProcessor('webhook'),
      ];

      await expect(buildPipeline().run(aFrameEvent())).rejects.toThrow('database down');
      expect(frameEventProcessors[1].process).not.toHaveBeenCalled();
    });

    it('should swallow a best-effort failure and keep going', async () => {
      frameEventProcessors = [
        aProcessor('webhook', false, () => Promise.reject(new Error('endpoint 500'))),
        aProcessor('metrics'),
      ];

      await expect(buildPipeline().run(aFrameEvent())).resolves.toEqual({});
      expect(frameEventProcessors[1].process).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should not let a best-effort failure trigger a redelivery of the event', async () => {
      frameEventProcessors = [
        aProcessor('persist', true),
        aProcessor('webhook', false, () => Promise.reject(new Error('endpoint 500'))),
      ];

      await expect(buildPipeline().run(aFrameEvent())).resolves.toBeDefined();
    });

    it('should apply the same policy to connection processors', async () => {
      connectionEventProcessors = [
        aProcessor('connection-webhook', false, () => Promise.reject(new Error('endpoint 500'))),
      ];

      await expect(buildPipeline().run(aConnectionEvent())).resolves.toEqual({});
    });
  });

  // ─── introspection ─────────────────────────────────────────────────────────

  describe('processorNames', () => {
    it('should report which processors serve which kind, in order', () => {
      expect(buildPipeline().processorNames).toEqual({
        frame: ['frame-a', 'frame-b'],
        connection: ['connection-a'],
      });
    });
  });
});
