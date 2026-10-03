// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { RabbitMqModuleReceiver } from '@/transport/queue/rabbit-mq/module-receiver.js';
import { OCPP_CallAction } from '@citrineos/types';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  aMockAmqpChannel,
  aMockChannelManager,
  aMockConnectionManager,
  aSystemConfigWithAmqp,
} from '../../../providers/rabbit-mq-provider.js';

const { container } = createTestContainer();

// Each identifier gets its own dedicated queue and consumer(s).
describe('RabbitMqModuleReceiver', () => {
  let receiver: RabbitMqModuleReceiver;
  let mockChannel: ReturnType<typeof aMockAmqpChannel>;
  let mockConnectionManager: ReturnType<typeof aMockConnectionManager>;
  let mockChannelManager: ReturnType<typeof aMockChannelManager>;

  beforeEach(() => {
    mockChannel = aMockAmqpChannel();
    mockConnectionManager = aMockConnectionManager();
    mockChannelManager = aMockChannelManager(mockChannel, mockConnectionManager);
    receiver = getTestInstance(container, RabbitMqModuleReceiver, {
      config: aSystemConfigWithAmqp(),
      channelManager: mockChannelManager,
      module: undefined,
    });
  });

  describe('constructor', () => {
    it('should throw when AMQP exchange is not configured', () => {
      expect(() =>
        getTestInstance(container, RabbitMqModuleReceiver, {
          config: aSystemConfigWithAmqp({ noAmqp: true }),
          channelManager: mockChannelManager,
          module: undefined,
        }),
      ).toThrow('RabbitMQ exchange is not configured');
    });
  });

  describe('subscribe()', () => {
    it('should return true and skip all queue operations for an empty actions array', async () => {
      const result = await receiver.subscribe('NoOp', [], {});

      expect(result).toBe(true);
      expect(mockChannel.assertQueue).not.toHaveBeenCalled();
      expect(mockChannel.consume).not.toHaveBeenCalled();
    });

    it('should create a dedicated queue and start one consumer per subscribe call', async () => {
      await receiver.subscribe('Provisioning', [OCPP_CallAction.BootNotification], {});

      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        'rabbit_queue_Provisioning',
        expect.objectContaining({ durable: true, autoDelete: true, exclusive: false }),
      );
      expect(mockChannel.consume).toHaveBeenCalledTimes(1);
    });

    it('should bind one entry per action when multiple actions are provided', async () => {
      await receiver.subscribe(
        'Transactions',
        [OCPP_CallAction.TransactionEvent, OCPP_CallAction.StatusNotification],
        { origin: 'CS' },
      );

      expect(mockChannel.bindQueue).toHaveBeenCalledTimes(2);
      expect(mockChannel.bindQueue).toHaveBeenCalledWith(
        'rabbit_queue_Transactions',
        'test-exchange',
        '',
        expect.objectContaining({ action: OCPP_CallAction.TransactionEvent }),
      );
      expect(mockChannel.bindQueue).toHaveBeenCalledWith(
        'rabbit_queue_Transactions',
        'test-exchange',
        '',
        expect.objectContaining({ action: OCPP_CallAction.StatusNotification }),
      );
    });

    it('should bind a single filter-only entry when no actions are provided', async () => {
      await receiver.subscribe('Router', undefined, {
        ocppConnectionName: 'CS001',
        state: 'Request',
      });

      expect(mockChannel.bindQueue).toHaveBeenCalledTimes(1);
      expect(mockChannel.bindQueue).toHaveBeenCalledWith(
        'rabbit_queue_Router',
        'test-exchange',
        '',
        expect.objectContaining({
          'x-match': 'all',
          ocppConnectionName: 'CS001',
          state: 'Request',
        }),
      );
    });

    it('should accumulate consumer tags when the same identifier subscribes more than once', async () => {
      (mockChannel.consume as any)
        .mockResolvedValueOnce({ consumerTag: 'tag-req' })
        .mockResolvedValueOnce({ consumerTag: 'tag-res' });

      await receiver.subscribe('Router', undefined, { state: 'Request' });
      await receiver.subscribe('Router', undefined, { state: 'Response' });

      // Both tags should be cancelled on unsubscribe
      await receiver.unsubscribe('Router');
      expect(mockChannel.cancel).toHaveBeenCalledWith('tag-req');
      expect(mockChannel.cancel).toHaveBeenCalledWith('tag-res');
    });
  });

  describe('channels and prefetch', () => {
    it('should open a separate channel for each identifier', async () => {
      await receiver.subscribe('Provisioning', [OCPP_CallAction.BootNotification], {});
      await receiver.subscribe('Provisioning_responses', [OCPP_CallAction.BootNotification], {});

      expect(mockChannelManager.getChannel).toHaveBeenCalledWith('module-receiver-Provisioning');
      expect(mockChannelManager.getChannel).toHaveBeenCalledWith(
        'module-receiver-Provisioning_responses',
      );
    });

    it('should set the configured module prefetch before starting the consumer', async () => {
      const configured = getTestInstance(container, RabbitMqModuleReceiver, {
        config: aSystemConfigWithAmqp({ prefetch: { module: 7 } }),
        channelManager: mockChannelManager,
        module: undefined,
      });

      await configured.subscribe('Provisioning', [OCPP_CallAction.BootNotification], {});

      expect(mockChannel.prefetch).toHaveBeenCalledWith(7);
      expect(vi.mocked(mockChannel.prefetch).mock.invocationCallOrder[0]).toBeLessThan(
        vi.mocked(mockChannel.consume).mock.invocationCallOrder[0],
      );
    });

    it('should cancel partial consumers before retrying channel recovery', async () => {
      const replacement = aMockAmqpChannel();
      let invalidated = false;
      vi.mocked(mockChannelManager.getChannel).mockImplementation(async () =>
        invalidated ? replacement : mockChannel,
      );
      await receiver.subscribe('Transactions', [OCPP_CallAction.TransactionEvent], {});
      await receiver.subscribe('Transactions', [OCPP_CallAction.StatusNotification], {});

      vi.mocked(replacement.consume)
        .mockImplementationOnce(async () => ({ consumerTag: 'partial-consumer' }))
        .mockRejectedValueOnce(new Error('channel closed during partial recovery'))
        .mockImplementationOnce(async () => ({ consumerTag: 'recovered-consumer-1' }))
        .mockImplementationOnce(async () => ({ consumerTag: 'recovered-consumer-2' }));
      invalidated = true;
      mockChannelManager.emit('channelInvalidated', 'module-receiver-Transactions');

      await vi.waitFor(() => expect(replacement.consume).toHaveBeenCalledTimes(4));

      expect(replacement.cancel).toHaveBeenCalledWith('partial-consumer');
      expect(replacement.consume).toHaveBeenCalledTimes(4);
    });

    it('should keep retrying channel recovery until the consumer is restored', async () => {
      const replacement = aMockAmqpChannel();
      await receiver.subscribe('Transactions', [OCPP_CallAction.TransactionEvent], {});

      vi.mocked(mockChannelManager.getChannel).mockResolvedValue(replacement);
      vi.mocked(replacement.assertExchange)
        .mockRejectedValueOnce(new Error('temporary broker error 1'))
        .mockRejectedValueOnce(new Error('temporary broker error 2'))
        .mockRejectedValueOnce(new Error('temporary broker error 3'));

      mockChannelManager.emit('channelInvalidated', 'module-receiver-Transactions');

      await vi.waitFor(() => expect(replacement.consume).toHaveBeenCalledTimes(1), {
        timeout: 5_000,
      });
      expect(replacement.assertExchange).toHaveBeenCalledTimes(4);
      expect(replacement.assertQueue).toHaveBeenCalledTimes(1);
    });
  });

  describe('unsubscribe()', () => {
    it('should cancel the consumer and return true for a known identifier', async () => {
      (mockChannel.consume as any).mockResolvedValueOnce({ consumerTag: 'tag-abc' });
      await receiver.subscribe('Provisioning', [OCPP_CallAction.BootNotification], {});

      const result = await receiver.unsubscribe('Provisioning');

      expect(result).toBe(true);
      expect(mockChannel.cancel).toHaveBeenCalledWith('tag-abc');
    });

    it('should return false and log a warning for an unknown identifier', async () => {
      const warnSpy = vi.spyOn((receiver as any)._logger, 'warn');

      const result = await receiver.unsubscribe('NonExistent');

      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No consumer tag found'));
    });
  });

  describe('shutdown()', () => {
    it('should detach reconnect and channel recovery listeners', async () => {
      const connectedListener = mockConnectionManager.on.mock.calls.find(
        ([event]) => event === 'connected',
      )?.[1];
      expect(connectedListener).toBeTypeOf('function');

      await receiver.shutdown();

      expect(mockConnectionManager.off).toHaveBeenCalledWith('connected', connectedListener);
      expect(mockChannelManager.off).toHaveBeenCalledWith(
        'channelInvalidated',
        expect.any(Function),
      );
    });

    it('should cancel every tracked consumer across all identifiers', async () => {
      (mockChannel.consume as any)
        .mockResolvedValueOnce({ consumerTag: 'tag-A' })
        .mockResolvedValueOnce({ consumerTag: 'tag-B' });

      await receiver.subscribe('ModuleA', [OCPP_CallAction.BootNotification], {});
      await receiver.subscribe('ModuleB', [OCPP_CallAction.StatusNotification], {});

      await receiver.shutdown();

      expect(mockChannel.cancel).toHaveBeenCalledWith('tag-A');
      expect(mockChannel.cancel).toHaveBeenCalledWith('tag-B');
    });

    it('should cancel a consumer if shutdown races channel recovery', async () => {
      const replacement = aMockAmqpChannel();
      await receiver.subscribe('Transactions', [OCPP_CallAction.TransactionEvent], {});

      let finishConsume!: (value: Awaited<ReturnType<typeof replacement.consume>>) => void;
      const pendingConsume = new Promise<Awaited<ReturnType<typeof replacement.consume>>>(
        (resolve) => {
          finishConsume = resolve;
        },
      );
      vi.mocked(replacement.consume).mockReturnValueOnce(pendingConsume);
      vi.mocked(mockChannelManager.getChannel).mockResolvedValue(replacement);

      mockChannelManager.emit('channelInvalidated', 'module-receiver-Transactions');
      await vi.waitFor(() => expect(replacement.consume).toHaveBeenCalledTimes(1));

      await receiver.shutdown();
      finishConsume({ consumerTag: 'late-recovery-consumer' });

      await vi.waitFor(() =>
        expect(replacement.cancel).toHaveBeenCalledWith('late-recovery-consumer'),
      );
      expect(replacement.consume).toHaveBeenCalledTimes(1);
    });
  });
});
