// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  ConnectionEventState,
  FrameDirection,
  MessageOrigin,
  MessageTypeId,
  MESSAGES_DLX,
  MESSAGES_EXCHANGE,
  MESSAGES_QUEUES,
  OCPP_CallAction,
} from '@citrineos/types';
import type * as amqplib from 'amqplib';
import { MessagesEventPublisher } from '@/transport/index.js';
import { aMockAmqpChannel } from '@test/providers/rabbit-mq-provider.js';
import {
  aConnectionEvent,
  aFrameEvent,
  anEmittingConnectionManager,
} from '@test/providers/messages-event-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import type { RabbitMQChannelManager } from '@/transport/queue/rabbit-mq/channel-manager.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('MessagesEventPublisher', () => {
  const { container, logger } = createTestContainer();
  let channel: amqplib.Channel;
  let channelManager: RabbitMQChannelManager;
  let connectionManager: ReturnType<typeof anEmittingConnectionManager>;
  let publisher: MessagesEventPublisher;

  function optionsOf(call = 0): amqplib.Options.Publish {
    return (channel.publish as any).mock.calls[call][3];
  }

  function envelopeOf(call = 0): any {
    return JSON.parse((channel.publish as any).mock.calls[call][2].toString());
  }

  beforeEach(() => {
    channel = aMockAmqpChannel();
    (channel as any).publish = vi.fn().mockReturnValue(true);
    connectionManager = anEmittingConnectionManager();
    channelManager = {
      getChannel: vi.fn().mockResolvedValue(channel),
      getConnectionManager: vi.fn().mockReturnValue(connectionManager),
    } as unknown as RabbitMQChannelManager;

    publisher = getTestInstance(container, MessagesEventPublisher, { channelManager });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ─── topology ──────────────────────────────────────────────────────────────

  describe('topology declaration', () => {
    it('should declare the exchange, both queues, both dead-letter queues and the bindings', async () => {
      await publisher.publish(aFrameEvent());

      expect(channel.assertExchange).toHaveBeenCalledWith(MESSAGES_EXCHANGE, 'topic', {
        durable: true,
      });
      expect(channel.assertExchange).toHaveBeenCalledWith(MESSAGES_DLX, 'topic', {
        durable: true,
      });

      for (const spec of MESSAGES_QUEUES) {
        expect(channel.assertQueue).toHaveBeenCalledWith(spec.queue, {
          durable: true,
          autoDelete: false,
          arguments: { 'x-dead-letter-exchange': MESSAGES_DLX },
        });
        expect(channel.bindQueue).toHaveBeenCalledWith(spec.queue, MESSAGES_EXCHANGE, spec.binding);
        expect(channel.assertQueue).toHaveBeenCalledWith(spec.dlq, {
          durable: true,
          autoDelete: false,
        });
        expect(channel.bindQueue).toHaveBeenCalledWith(spec.dlq, MESSAGES_DLX, spec.binding);
      }
    });

    it('should declare the topology before the first publish, not after', async () => {
      const order: string[] = [];
      (channel.bindQueue as any).mockImplementation(async () => void order.push('bind'));
      (channel.publish as any).mockImplementation(() => {
        order.push('publish');
        return true;
      });

      await publisher.publish(aFrameEvent());

      expect(order.indexOf('publish')).toBe(order.length - 1);
      expect(order.filter((step) => step === 'bind')).not.toHaveLength(0);
    });

    it('should declare the topology once across many publishes', async () => {
      for (let i = 0; i < 5; i += 1) {
        await publisher.publish(aFrameEvent());
      }

      expect(channel.assertExchange).toHaveBeenCalledTimes(2);
      expect(channel.publish).toHaveBeenCalledTimes(5);
    });

    it('should declare the topology once for a concurrent burst', async () => {
      await Promise.all(Array.from({ length: 5 }, () => publisher.publish(aFrameEvent())));

      expect(channel.assertExchange).toHaveBeenCalledTimes(2);
    });

    it('should re-declare after a reconnect, because the broker may have been replaced', async () => {
      await publisher.publish(aFrameEvent());
      expect(channel.assertExchange).toHaveBeenCalledTimes(2);

      connectionManager.emit('connected');
      await publisher.publish(aFrameEvent());

      expect(channel.assertExchange).toHaveBeenCalledTimes(4);
    });

    it('should retry declaration on the next publish after it failed', async () => {
      (channel.assertExchange as any).mockRejectedValueOnce(new Error('broker down'));

      expect(await publisher.publish(aFrameEvent())).toBe(false);
      expect(channel.publish).not.toHaveBeenCalled();

      expect(await publisher.publish(aFrameEvent())).toBe(true);
      expect(channel.publish).toHaveBeenCalledTimes(1);
    });
  });

  // ─── publish ───────────────────────────────────────────────────────────────

  describe('publish', () => {
    it('should publish a frame to its routing key with the whole envelope as the body', async () => {
      const event = aFrameEvent();

      expect(await publisher.publish(event)).toBe(true);

      expect(channel.publish).toHaveBeenCalledWith(
        MESSAGES_EXCHANGE,
        'frame.inbound.Heartbeat',
        expect.any(Buffer),
        expect.anything(),
      );
      expect(envelopeOf()).toEqual(JSON.parse(JSON.stringify(event)));
    });

    it('should publish a connection event to its own routing key', async () => {
      await publisher.publish(aConnectionEvent({ state: ConnectionEventState.Closed }));

      expect(channel.publish).toHaveBeenCalledWith(
        MESSAGES_EXCHANGE,
        'connection.closed',
        expect.any(Buffer),
        expect.anything(),
      );
    });

    it('should mark events persistent so a broker restart does not lose the backlog', async () => {
      await publisher.publish(aFrameEvent());

      expect(optionsOf()).toMatchObject({
        persistent: true,
        contentType: 'application/json',
        contentEncoding: 'utf-8',
      });
    });

    it('should carry the correlation id as the AMQP messageId for a frame', async () => {
      await publisher.publish(aFrameEvent({ correlationId: 'abc' }));

      expect(optionsOf().messageId).toBe('abc');
    });

    it('should not invent a messageId for a connection event, which has no correlation id', async () => {
      await publisher.publish(aConnectionEvent());

      expect(optionsOf().messageId).toBeUndefined();
    });

    it('should expose a frames facets as headers so a consumer can filter without decoding', async () => {
      await publisher.publish(
        aFrameEvent({
          direction: FrameDirection.Outbound,
          origin: MessageOrigin.ChargingStationManagementSystem,
          type: MessageTypeId.CallResult,
          action: OCPP_CallAction.BootNotification,
        }),
      );

      expect(optionsOf().headers).toEqual({
        kind: 'frame',
        tenantId: '1',
        direction: FrameDirection.Outbound,
        origin: MessageOrigin.ChargingStationManagementSystem,
        parsed: 'true',
        action: OCPP_CallAction.BootNotification,
        type: MessageTypeId.CallResult.toString(),
      });
    });

    it('should omit the action and type headers when the frame never parsed', async () => {
      await publisher.publish(
        aFrameEvent({ parsed: false, action: undefined, type: undefined, raw: 'nope' }),
      );

      expect(optionsOf().headers).toEqual({
        kind: 'frame',
        tenantId: '1',
        direction: FrameDirection.Inbound,
        origin: MessageOrigin.ChargingStation,
        parsed: 'false',
      });
    });

    it('should expose the state header for a connection event', async () => {
      await publisher.publish(aConnectionEvent({ state: ConnectionEventState.Closed }));

      expect(optionsOf().headers).toEqual({
        kind: 'connection',
        tenantId: '1',
        state: ConnectionEventState.Closed,
      });
    });

    it('should report backpressure without treating it as a loss', async () => {
      (channel.publish as any).mockReturnValue(false);

      expect(await publisher.publish(aFrameEvent())).toBe(false);
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  // ─── failure containment ───────────────────────────────────────────────────

  describe('failure containment', () => {
    it('should never throw when the broker is unreachable', async () => {
      (channelManager.getChannel as any).mockRejectedValue(new Error('no connection'));

      await expect(publisher.publish(aFrameEvent())).resolves.toBe(false);
      expect(logger.error).toHaveBeenCalled();
    });

    it('should never throw when publish itself throws', async () => {
      (channel.publish as any).mockImplementation(() => {
        throw new Error('channel closed');
      });

      await expect(publisher.publish(aFrameEvent())).resolves.toBe(false);
    });

    it('should count drops cumulatively so an outage is visible in the logs', async () => {
      (channel.publish as any).mockImplementation(() => {
        throw new Error('channel closed');
      });

      await publisher.publish(aFrameEvent());
      await publisher.publish(aFrameEvent());

      expect(logger.error.mock.calls.at(-1)?.[0]).toContain('dropped so far: 2');
    });
  });
});
