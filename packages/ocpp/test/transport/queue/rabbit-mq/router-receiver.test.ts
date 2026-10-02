// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { RabbitMqRouterReceiver } from '@/transport/queue/rabbit-mq/router-receiver.js';
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

// One shared queue per process instance; charger connections add/remove bindings.
describe('RabbitMqRouterReceiver', () => {
  let receiver: RabbitMqRouterReceiver;
  let mockChannel: ReturnType<typeof aMockAmqpChannel>;
  let mockConnectionManager: ReturnType<typeof aMockConnectionManager>;
  let mockChannelManager: ReturnType<typeof aMockChannelManager>;

  beforeEach(() => {
    mockChannel = aMockAmqpChannel();
    mockConnectionManager = aMockConnectionManager();
    mockChannelManager = aMockChannelManager(mockChannel, mockConnectionManager);
    receiver = getTestInstance(container, RabbitMqRouterReceiver, {
      config: aSystemConfigWithAmqp({ instanceIdentifier: 'pod-1' }),
      channelManager: mockChannelManager,
      module: undefined,
    });
  });

  describe('constructor', () => {
    it('should derive the instance queue name from instanceIdentifier in config', async () => {
      await receiver.subscribe('charger-1', undefined, { ocppConnectionName: 'CS001' });

      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        'rabbit_queue_router_pod-1',
        expect.objectContaining({ durable: true, autoDelete: true, exclusive: false }),
      );
    });

    it('should fall back to a timestamp-based name when instanceIdentifier is absent', async () => {
      const fallbackReceiver = getTestInstance(container, RabbitMqRouterReceiver, {
        config: aSystemConfigWithAmqp(),
        channelManager: mockChannelManager,
        module: undefined,
      });

      await fallbackReceiver.subscribe('charger-1', undefined, { ocppConnectionName: 'CS001' });

      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        expect.stringMatching(/^rabbit_queue_router_router-\d+$/),
        expect.anything(),
      );
    });
  });

  describe('subscribe() — lazy initialisation', () => {
    it('should assert the instance queue and start exactly one consumer on first subscribe', async () => {
      await receiver.subscribe('charger-1', undefined, { ocppConnectionName: 'CS001' });

      expect(mockChannel.assertQueue).toHaveBeenCalledTimes(1);
      expect(mockChannel.consume).toHaveBeenCalledTimes(1);
    });

    it('should not start additional consumers on subsequent subscribe calls', async () => {
      await receiver.subscribe('charger-1', undefined, {
        ocppConnectionName: 'CS001',
        state: 'Request',
      });
      await receiver.subscribe('charger-1', undefined, {
        ocppConnectionName: 'CS001',
        state: 'Response',
      });
      await receiver.subscribe('charger-2', undefined, {
        ocppConnectionName: 'CS002',
        state: 'Request',
      });

      // initializeInstanceQueue only fires once — consume must be called exactly once
      expect(mockChannel.consume).toHaveBeenCalledTimes(1);
    });

    it('should initialise the instance queue only once across concurrent subscribe calls', async () => {
      await Promise.all([
        receiver.subscribe('charger-1', undefined, { ocppConnectionName: 'CS001' }),
        receiver.subscribe('charger-2', undefined, { ocppConnectionName: 'CS002' }),
        receiver.subscribe('charger-3', undefined, { ocppConnectionName: 'CS003' }),
      ]);

      expect(mockChannel.consume).toHaveBeenCalledTimes(1);
      // One binding per charger
      expect(mockChannel.bindQueue).toHaveBeenCalledTimes(3);
    });

    it('should register a reconnect handler on the connection manager', async () => {
      await receiver.subscribe('charger-1', undefined, { ocppConnectionName: 'CS001' });

      expect(mockConnectionManager.on).toHaveBeenCalledWith('connected', expect.any(Function));
    });
  });

  describe('subscribe() — binding behaviour', () => {
    it('should bind to the instance queue (not create a new queue) on subscribe', async () => {
      await receiver.subscribe('charger-1', undefined, {
        ocppConnectionName: 'CS001',
        state: 'Request',
      });

      expect(mockChannel.bindQueue).toHaveBeenCalledWith(
        'rabbit_queue_router_pod-1',
        'test-exchange',
        '',
        expect.objectContaining({
          'x-match': 'all',
          ocppConnectionName: 'CS001',
          state: 'Request',
        }),
      );
    });

    it('should create one binding per action on the instance queue when actions are provided', async () => {
      await receiver.subscribe(
        'charger-1',
        [OCPP_CallAction.BootNotification, OCPP_CallAction.Heartbeat],
        { ocppConnectionName: 'CS001' },
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

  describe('channel and prefetch', () => {
    it('should use the router-receiver channel', async () => {
      await receiver.subscribe('charger-1', undefined, { ocppConnectionName: 'CS001' });

      expect(mockChannelManager.getChannel).toHaveBeenCalledWith('router-receiver');
      expect(mockChannelManager.getChannel).not.toHaveBeenCalledWith(
        expect.stringMatching(/^module-receiver-/),
      );
    });

    it('should set the configured router prefetch before starting the consumer', async () => {
      const configured = getTestInstance(container, RabbitMqRouterReceiver, {
        config: aSystemConfigWithAmqp({ instanceIdentifier: 'pod-1', prefetch: { router: 42 } }),
        channelManager: mockChannelManager,
        module: undefined,
      });

      await configured.subscribe('charger-1', undefined, { ocppConnectionName: 'CS001' });

      expect(mockChannel.prefetch).toHaveBeenCalledWith(42);
      expect(vi.mocked(mockChannel.prefetch).mock.invocationCallOrder[0]).toBeLessThan(
        vi.mocked(mockChannel.consume).mock.invocationCallOrder[0],
      );
    });
  });

  describe('unsubscribe()', () => {
    it('should remove the bindings from the instance queue and return true', async () => {
      await receiver.subscribe('charger-1', undefined, {
        ocppConnectionName: 'CS001',
        state: 'Request',
        origin: 'CSMS',
      });

      const result = await receiver.unsubscribe('charger-1');

      expect(result).toBe(true);
      expect(mockChannel.unbindQueue).toHaveBeenCalledWith(
        'rabbit_queue_router_pod-1',
        'test-exchange',
        '',
        expect.objectContaining({ ocppConnectionName: 'CS001' }),
      );
    });

    it('should return false and log a warning when the identifier has no bindings', async () => {
      // Subscribe triggers lazy init so _instanceQueueName is set; then try to
      // unsubscribe something that was never subscribed.
      await receiver.subscribe('charger-1', undefined, { ocppConnectionName: 'CS001' });
      const warnSpy = vi.spyOn((receiver as any)._logger, 'warn');

      const result = await receiver.unsubscribe('unknown-charger');

      expect(result).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('No bindings found'));
    });
  });

  describe('shutdown()', () => {
    it('should cancel the single instance consumer', async () => {
      (mockChannel.consume as any).mockResolvedValueOnce({
        consumerTag: 'instance-consumer-tag',
      });

      await receiver.subscribe('charger-1', undefined, { ocppConnectionName: 'CS001' });
      await receiver.shutdown();

      expect(mockChannel.cancel).toHaveBeenCalledWith('instance-consumer-tag');
      expect(mockChannel.cancel).toHaveBeenCalledTimes(1);
    });
  });
});
