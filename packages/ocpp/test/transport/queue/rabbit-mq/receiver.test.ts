// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { RabbitMqModuleReceiver } from '@/transport/queue/rabbit-mq/module-receiver.js';
import { type RabbitMqReceiver } from '@/transport/queue/rabbit-mq/receiver.js';
import { OCPP_CallAction, RetryMessageError } from '@citrineos/types';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  aConsumeMessage,
  aConsumeMessageWithPrefixedFields,
  aMockAmqpChannel,
  aMockChannelManager,
  aSystemConfigWithAmqp,
} from '../../../providers/rabbit-mq-provider.js';

describe('RabbitMqReceiver', () => {
  const { container } = createTestContainer();

  // Exercised through RabbitMqModuleReceiver; _onMessage lives on the shared base class.
  describe('_onMessage', () => {
    let receiver: RabbitMqReceiver;
    let mockChannel: ReturnType<typeof aMockAmqpChannel>;

    beforeEach(() => {
      mockChannel = aMockAmqpChannel();
      receiver = getTestInstance(container, RabbitMqModuleReceiver, {
        config: aSystemConfigWithAmqp(),
        channelManager: aMockChannelManager(mockChannel),
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

    it('should republish with the retry counter started when handle throws RetryMessageError', async () => {
      vi.spyOn(receiver, 'handle').mockRejectedValueOnce(new RetryMessageError('call in progress'));
      vi.spyOn(receiver as any, '_backoff').mockReturnValue(0); // don't sleep for real
      const msg = aConsumeMessage();

      await (receiver as any)._onMessage(msg, mockChannel, 'test-queue');

      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'test-queue',
        msg.content,
        expect.objectContaining({ headers: expect.objectContaining({ 'x-retries': 1 }) }),
      );
      // The original delivery is acked, not nacked: the republish above is the requeue.
      expect(mockChannel.ack).toHaveBeenCalledWith(msg);
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });

    it('should increment the retry counter carried on the redelivered message', async () => {
      vi.spyOn(receiver, 'handle').mockRejectedValueOnce(new RetryMessageError('call in progress'));
      vi.spyOn(receiver as any, '_backoff').mockReturnValue(0); // don't sleep for real
      const msg = aConsumeMessage({ headers: { 'x-retries': 3 } });

      await (receiver as any)._onMessage(msg, mockChannel, 'test-queue');

      expect(mockChannel.sendToQueue).toHaveBeenCalledWith(
        'test-queue',
        msg.content,
        expect.objectContaining({ headers: expect.objectContaining({ 'x-retries': 4 }) }),
      );
    });

    it('should preserve the original headers and content when republishing a retry', async () => {
      vi.spyOn(receiver, 'handle').mockRejectedValueOnce(new RetryMessageError('call in progress'));
      vi.spyOn(receiver as any, '_backoff').mockReturnValue(0); // don't sleep for real
      const msg = aConsumeMessage({ headers: { action: 'BootNotification', tenantId: '1' } });

      await (receiver as any)._onMessage(msg, mockChannel, 'test-queue');

      const [, content, props] = (mockChannel.sendToQueue as any).mock.calls[0];
      expect(content).toBe(msg.content);
      expect(props.headers).toMatchObject({
        action: 'BootNotification',
        tenantId: '1',
        'x-retries': 1,
      });
    });

    it('should back off for longer as the retry count grows', () => {
      const backoff = (attempt: number) => (receiver as any)._backoff(attempt);
      // Jitter is ±25%, so compare attempts far enough apart to clear the overlap.
      expect(backoff(0)).toBeLessThan(backoff(3));
      expect(backoff(3)).toBeLessThan(backoff(6));
      expect(backoff(20)).toBeLessThanOrEqual(1000 * 1.25); // capped
    });

    it('should drop the message once retrying would push it past the max age', async () => {
      vi.spyOn(receiver, 'handle').mockRejectedValueOnce(new RetryMessageError('call in progress'));
      const errorSpy = vi.spyOn((receiver as any)._logger, 'error');
      // maxCallLengthSeconds defaults to 20 in the test config.
      const msg = aConsumeMessage({
        context: {
          correlationId: 'test-correlation-id',
          ocppConnectionName: 'CS001',
          tenantId: '1',
          timestamp: new Date(Date.now() - 30_000).toISOString(),
        },
        headers: { 'x-retries': 12 },
      });

      await (receiver as any)._onMessage(msg, mockChannel, 'test-queue');

      expect(mockChannel.sendToQueue).not.toHaveBeenCalled();
      expect(mockChannel.nack).toHaveBeenCalledWith(msg, false, false);
      expect(mockChannel.ack).not.toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('test-correlation-id'));
    });

    it('should log the error and still ack when handle throws a non-retryable error', async () => {
      vi.spyOn(receiver, 'handle').mockRejectedValueOnce(new Error('unexpected failure'));
      const errorSpy = vi.spyOn((receiver as any)._logger, 'error');
      const msg = aConsumeMessage();

      await (receiver as any)._onMessage(msg, mockChannel, 'test-queue');

      expect(errorSpy).toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalledWith(msg);
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });
  });
});
