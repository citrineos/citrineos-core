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
  aSystemConfigWithAmqp,
} from '../../../providers/rabbit-mq-provider.js';

const { container } = createTestContainer();

// Each identifier gets its own dedicated queue and consumer(s).
describe('RabbitMqModuleReceiver', () => {
  let receiver: RabbitMqModuleReceiver;
  let mockChannel: ReturnType<typeof aMockAmqpChannel>;
  let mockChannelManager: ReturnType<typeof aMockChannelManager>;

  beforeEach(() => {
    mockChannel = aMockAmqpChannel();
    mockChannelManager = aMockChannelManager(mockChannel);
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
  });
});
