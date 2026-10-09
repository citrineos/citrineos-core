// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { RabbitMqModuleReceiver } from '@/transport/queue/rabbit-mq/module-receiver.js';
import { type RabbitMqReceiver } from '@/transport/queue/rabbit-mq/receiver.js';
import { OCPP_CallAction } from '@citrineos/types';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  aConsumeMessage,
  aConsumeMessageWithPrefixedFields,
  aMockAmqpChannel,
  aMockChannelManager,
  aMockDeadLetterPublisher,
  aSystemConfigWithAmqp,
  type MockDeadLetterPublisher,
} from '../../../providers/rabbit-mq-provider.js';

describe('RabbitMqReceiver', () => {
  const { container } = createTestContainer();

  // Exercised through RabbitMqModuleReceiver; _onMessage lives on the shared base class.
  describe('_onMessage', () => {
    let receiver: RabbitMqReceiver;
    let mockChannel: ReturnType<typeof aMockAmqpChannel>;
    let deadLetterPublisher: MockDeadLetterPublisher;

    beforeEach(() => {
      mockChannel = aMockAmqpChannel();
      deadLetterPublisher = aMockDeadLetterPublisher();
      receiver = getTestInstance(container, RabbitMqModuleReceiver, {
        config: aSystemConfigWithAmqp(),
        channelManager: aMockChannelManager(mockChannel),
        deadLetterPublisher,
        module: undefined,
      });
      // Prevent handle() from throwing due to no registered handlers
      vi.spyOn(receiver, 'handle').mockResolvedValue(undefined);
    });

    it('should do nothing for a null message', async () => {
      await (receiver as any)._onMessage(null, mockChannel, 'test-queue');

      expect(mockChannel.ack).not.toHaveBeenCalled();
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });

    it('should parse a message with direct field names, call handle, and ack', async () => {
      const msg = aConsumeMessage({ action: OCPP_CallAction.BootNotification });

      await (receiver as any)._onMessage(msg, mockChannel, 'test-queue');

      expect(receiver.handle).toHaveBeenCalledWith(
        expect.objectContaining({ _action: OCPP_CallAction.BootNotification }),
        expect.anything(),
      );
      expect(mockChannel.ack).toHaveBeenCalledWith(msg);
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });

    it('should parse a message with underscore-prefixed field names correctly', async () => {
      const msg = aConsumeMessageWithPrefixedFields({ action: OCPP_CallAction.Heartbeat });

      await (receiver as any)._onMessage(msg, mockChannel, 'test-queue');

      expect(receiver.handle).toHaveBeenCalledWith(
        expect.objectContaining({ _action: OCPP_CallAction.Heartbeat }),
        expect.anything(),
      );
      expect(mockChannel.ack).toHaveBeenCalled();
    });

    it('should dead-letter a handler failure as handler_error and ack it without retrying', async () => {
      vi.spyOn(receiver, 'handle').mockRejectedValueOnce(new Error('unexpected failure'));
      const errorSpy = vi.spyOn((receiver as any)._logger, 'error');
      const msg = aConsumeMessage({ headers: { action: 'Heartbeat', tenantId: '1' } });

      await (receiver as any)._onMessage(msg, mockChannel, 'test-queue');

      expect(errorSpy).toHaveBeenCalled();
      expect(deadLetterPublisher.publishRaw).toHaveBeenCalledWith(
        msg.content,
        { action: 'Heartbeat', tenantId: '1' },
        'handler_error',
        'module',
        { queue: 'test-queue', error: new Error('unexpected failure') },
      );
      expect(receiver.handle).toHaveBeenCalledTimes(1);
      expect(mockChannel.sendToQueue).not.toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalledWith(msg);
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });

    it('should dead-letter a body that is not JSON as poison, without handling it', async () => {
      const msg = aConsumeMessage();
      msg.content = Buffer.from('not json');

      await (receiver as any)._onMessage(msg, mockChannel, 'test-queue');

      expect(receiver.handle).not.toHaveBeenCalled();
      expect(deadLetterPublisher.publishRaw).toHaveBeenCalledWith(
        msg.content,
        {},
        'poison',
        'module',
        expect.objectContaining({ queue: 'test-queue' }),
      );
      expect(mockChannel.ack).toHaveBeenCalledWith(msg);
    });

    it('should not dead-letter a message that was handled', async () => {
      await (receiver as any)._onMessage(aConsumeMessage(), mockChannel, 'test-queue');

      expect(deadLetterPublisher.publishRaw).not.toHaveBeenCalled();
    });
  });
});
