// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OCPP_CallAction, RetryMessageError } from '@citrineos/base';
import { RabbitMqReceiver } from '../../../queue/rabbit-mq/receiver.js';
import {
  aConsumeMessage,
  aConsumeMessageWithPrefixedFields,
  aMockAmqpChannel,
  aMockChannelManager,
  aMockConnectionManager,
  aSystemConfigWithAmqp,
} from '../../providers/RabbitMqProvider.js';

describe('RabbitMqReceiver', () => {
  // ---------------------------------------------------------------------------
  // MODULE_MODE — default behaviour, no routerMode flag
  // Each identifier gets its own dedicated queue and consumer(s).
  // ---------------------------------------------------------------------------
  describe('RabbitMqReceiver — MODULE_MODE', () => {
    let receiver: RabbitMqReceiver;
    let mockChannel: ReturnType<typeof aMockAmqpChannel>;
    let mockChannelManager: ReturnType<typeof aMockChannelManager>;

    beforeEach(() => {
      mockChannel = aMockAmqpChannel();
      mockChannelManager = aMockChannelManager(mockChannel);
      receiver = new RabbitMqReceiver(aSystemConfigWithAmqp(), mockChannelManager);
    });

    describe('constructor', () => {
      it('should throw when AMQP exchange is not configured', () => {
        expect(
          () =>
            new RabbitMqReceiver(
              { util: { messageBroker: { amqp: undefined } } } as any,
              mockChannelManager,
            ),
        ).toThrow('RabbitMQ exchange is not configured');
      });

      it('should not activate router mode when routerMode is omitted', async () => {
        // If router mode were active the first subscribe would call assertQueue with
        // a "rabbit_queue_router_*" name.  In module mode it uses the identifier.
        await receiver.subscribe('Provisioning', [OCPP_CallAction.BootNotification], {});

        const assertedName = (mockChannel.assertQueue as any).mock.calls[0][0] as string;
        expect(assertedName).toBe('rabbit_queue_Provisioning');
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
        await receiver.subscribe('Router', undefined, { stationId: 'CS001', state: 'Request' });

        expect(mockChannel.bindQueue).toHaveBeenCalledTimes(1);
        expect(mockChannel.bindQueue).toHaveBeenCalledWith(
          'rabbit_queue_Router',
          'test-exchange',
          '',
          expect.objectContaining({ 'x-match': 'all', stationId: 'CS001', state: 'Request' }),
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

  // ---------------------------------------------------------------------------
  // ROUTER_MODE — activated by passing routerMode=true
  // One shared queue per process instance; charger connections add/remove bindings.
  // ---------------------------------------------------------------------------
  describe('RabbitMqReceiver — ROUTER_MODE', () => {
    let receiver: RabbitMqReceiver;
    let mockChannel: ReturnType<typeof aMockAmqpChannel>;
    let mockConnectionManager: ReturnType<typeof aMockConnectionManager>;
    let mockChannelManager: ReturnType<typeof aMockChannelManager>;

    beforeEach(() => {
      mockChannel = aMockAmqpChannel();
      mockConnectionManager = aMockConnectionManager();
      mockChannelManager = aMockChannelManager(mockChannel, mockConnectionManager);
      receiver = new RabbitMqReceiver(
        aSystemConfigWithAmqp({ instanceIdentifier: 'pod-1' }),
        mockChannelManager,
        undefined,
        undefined,
        /* routerMode */ true,
      );
    });

    describe('constructor', () => {
      it('should derive the instance queue name from instanceIdentifier in config', async () => {
        await receiver.subscribe('charger-1', undefined, { stationId: 'CS001' });

        expect(mockChannel.assertQueue).toHaveBeenCalledWith(
          'rabbit_queue_router_pod-1',
          expect.objectContaining({ durable: true, autoDelete: false, exclusive: false }),
        );
      });

      it('should fall back to a timestamp-based name when instanceIdentifier is absent', async () => {
        const fallbackReceiver = new RabbitMqReceiver(
          aSystemConfigWithAmqp(), // no instanceIdentifier
          mockChannelManager,
          undefined,
          undefined,
          true,
        );

        await fallbackReceiver.subscribe('charger-1', undefined, { stationId: 'CS001' });

        expect(mockChannel.assertQueue).toHaveBeenCalledWith(
          expect.stringMatching(/^rabbit_queue_router_router-\d+$/),
          expect.anything(),
        );
      });

      it('should NOT activate router mode when routerMode is false', async () => {
        const moduleReceiver = new RabbitMqReceiver(
          aSystemConfigWithAmqp({ instanceIdentifier: 'pod-1' }),
          mockChannelManager,
          undefined,
          undefined,
          false,
        );

        await moduleReceiver.subscribe('ModuleX', [OCPP_CallAction.BootNotification], {});

        // Module mode creates a queue named after the identifier, not the instance queue
        expect(mockChannel.assertQueue).toHaveBeenCalledWith(
          'rabbit_queue_ModuleX',
          expect.anything(),
        );
      });
    });

    describe('subscribe() — lazy initialisation', () => {
      it('should assert the instance queue and start exactly one consumer on first subscribe', async () => {
        await receiver.subscribe('charger-1', undefined, { stationId: 'CS001' });

        expect(mockChannel.assertQueue).toHaveBeenCalledTimes(1);
        expect(mockChannel.consume).toHaveBeenCalledTimes(1);
      });

      it('should not start additional consumers on subsequent subscribe calls', async () => {
        await receiver.subscribe('charger-1', undefined, { stationId: 'CS001', state: 'Request' });
        await receiver.subscribe('charger-1', undefined, { stationId: 'CS001', state: 'Response' });
        await receiver.subscribe('charger-2', undefined, { stationId: 'CS002', state: 'Request' });

        // initializeInstanceQueue only fires once — consume must be called exactly once
        expect(mockChannel.consume).toHaveBeenCalledTimes(1);
      });

      it('should initialise the instance queue only once across concurrent subscribe calls', async () => {
        await Promise.all([
          receiver.subscribe('charger-1', undefined, { stationId: 'CS001' }),
          receiver.subscribe('charger-2', undefined, { stationId: 'CS002' }),
          receiver.subscribe('charger-3', undefined, { stationId: 'CS003' }),
        ]);

        expect(mockChannel.consume).toHaveBeenCalledTimes(1);
        // One binding per charger
        expect(mockChannel.bindQueue).toHaveBeenCalledTimes(3);
      });

      it('should register a reconnect handler on the connection manager', async () => {
        await receiver.subscribe('charger-1', undefined, { stationId: 'CS001' });

        expect(mockConnectionManager.on).toHaveBeenCalledWith('connected', expect.any(Function));
      });
    });

    describe('subscribe() — binding behaviour', () => {
      it('should bind to the instance queue (not create a new queue) on subscribe', async () => {
        await receiver.subscribe('charger-1', undefined, { stationId: 'CS001', state: 'Request' });

        expect(mockChannel.bindQueue).toHaveBeenCalledWith(
          'rabbit_queue_router_pod-1',
          'test-exchange',
          '',
          expect.objectContaining({ 'x-match': 'all', stationId: 'CS001', state: 'Request' }),
        );
      });

      it('should create one binding per action on the instance queue when actions are provided', async () => {
        await receiver.subscribe(
          'charger-1',
          [OCPP_CallAction.BootNotification, OCPP_CallAction.Heartbeat],
          { stationId: 'CS001' },
        );

        expect(mockChannel.bindQueue).toHaveBeenCalledTimes(2);
        expect(mockChannel.bindQueue).toHaveBeenCalledWith(
          'rabbit_queue_router_pod-1',
          'test-exchange',
          '',
          expect.objectContaining({ action: OCPP_CallAction.BootNotification }),
        );
        expect(mockChannel.bindQueue).toHaveBeenCalledWith(
          'rabbit_queue_router_pod-1',
          'test-exchange',
          '',
          expect.objectContaining({ action: OCPP_CallAction.Heartbeat }),
        );
      });
    });

    describe('unsubscribe()', () => {
      it('should remove the bindings from the instance queue and return true', async () => {
        await receiver.subscribe('charger-1', undefined, {
          stationId: 'CS001',
          state: 'Request',
          origin: 'CSMS',
        });

        const result = await receiver.unsubscribe('charger-1');

        expect(result).toBe(true);
        expect(mockChannel.unbindQueue).toHaveBeenCalledWith(
          'rabbit_queue_router_pod-1',
          'test-exchange',
          '',
          expect.objectContaining({ stationId: 'CS001' }),
        );
      });

      it('should return false and log a warning when the identifier has no bindings', async () => {
        // Subscribe triggers lazy init so _instanceQueueName is set; then try to
        // unsubscribe something that was never subscribed.
        await receiver.subscribe('charger-1', undefined, { stationId: 'CS001' });
        const warnSpy = vi.spyOn((receiver as any)._logger, 'warn');

        const result = await receiver.unsubscribe('unknown-charger');

        expect(result).toBe(false);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No bindings found'));
      });
    });

    describe('shutdown()', () => {
      it('should cancel the single instance consumer and not attempt module-mode cleanup', async () => {
        (mockChannel.consume as any).mockResolvedValueOnce({
          consumerTag: 'instance-consumer-tag',
        });

        await receiver.subscribe('charger-1', undefined, { stationId: 'CS001' });
        await receiver.shutdown();

        expect(mockChannel.cancel).toHaveBeenCalledWith('instance-consumer-tag');
        expect(mockChannel.cancel).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // _onMessage — message parsing and ack/nack behaviour (shared across modes)
  // ---------------------------------------------------------------------------
  describe('RabbitMqReceiver — _onMessage', () => {
    let receiver: RabbitMqReceiver;
    let mockChannel: ReturnType<typeof aMockAmqpChannel>;

    beforeEach(() => {
      mockChannel = aMockAmqpChannel();
      receiver = new RabbitMqReceiver(aSystemConfigWithAmqp(), aMockChannelManager(mockChannel));
      // Prevent handle() from throwing due to no registered handlers
      vi.spyOn(receiver, 'handle').mockResolvedValue(undefined);
    });

    it('should do nothing for a null message', async () => {
      await (receiver as any)._onMessage(null, mockChannel);

      expect(mockChannel.ack).not.toHaveBeenCalled();
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });

    it('should parse a message with direct field names, call handle, and ack', async () => {
      const msg = aConsumeMessage({ action: OCPP_CallAction.BootNotification });

      await (receiver as any)._onMessage(msg, mockChannel);

      expect(receiver.handle).toHaveBeenCalledWith(
        expect.objectContaining({ _action: OCPP_CallAction.BootNotification }),
        expect.anything(),
      );
      expect(mockChannel.ack).toHaveBeenCalledWith(msg);
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });

    it('should parse a message with underscore-prefixed field names correctly', async () => {
      const msg = aConsumeMessageWithPrefixedFields({ action: OCPP_CallAction.Heartbeat });

      await (receiver as any)._onMessage(msg, mockChannel);

      expect(receiver.handle).toHaveBeenCalledWith(
        expect.objectContaining({ _action: OCPP_CallAction.Heartbeat }),
        expect.anything(),
      );
      expect(mockChannel.ack).toHaveBeenCalled();
    });

    it('should nack and return without acking when handle throws RetryMessageError', async () => {
      vi.spyOn(receiver, 'handle').mockRejectedValueOnce(new RetryMessageError('call in progress'));
      const msg = aConsumeMessage();

      await (receiver as any)._onMessage(msg, mockChannel);

      expect(mockChannel.nack).toHaveBeenCalledWith(msg);
      expect(mockChannel.ack).not.toHaveBeenCalled();
    });

    it('should log the error and still ack when handle throws a non-retryable error', async () => {
      vi.spyOn(receiver, 'handle').mockRejectedValueOnce(new Error('unexpected failure'));
      const errorSpy = vi.spyOn((receiver as any)._logger, 'error');
      const msg = aConsumeMessage();

      await (receiver as any)._onMessage(msg, mockChannel);

      expect(errorSpy).toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalledWith(msg);
      expect(mockChannel.nack).not.toHaveBeenCalled();
    });
  });
});
