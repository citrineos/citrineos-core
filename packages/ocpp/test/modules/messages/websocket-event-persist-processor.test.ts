// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { MessageOrigin, type MessagesEventContext } from '@citrineos/types';
import { WebsocketEventPersistProcessor } from '@modules/messages/processors/websocket-event-persist-processor.js';
import { aWebsocketLifecycleEvent } from '@test/providers/messages-event-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('WebsocketEventPersistProcessor', () => {
  const { container } = createTestContainer();
  let websocketEventRepository: { createWebsocketEvent: ReturnType<typeof vi.fn> };
  let processor: WebsocketEventPersistProcessor;

  function call(): unknown[] {
    return websocketEventRepository.createWebsocketEvent.mock.calls[0];
  }

  beforeEach(() => {
    websocketEventRepository = {
      createWebsocketEvent: vi.fn().mockResolvedValue({ id: 42 }),
    };
    processor = getTestInstance(container, WebsocketEventPersistProcessor, {
      websocketEventRepository,
    });
  });

  describe('processor contract', () => {
    it('should be critical, because losing an audit row must fail the event', () => {
      expect(processor.critical).toBe(true);
      expect(processor.name).toBe('websocket-event-persist');
    });
  });

  describe('process', () => {
    it('should persist every lifecycle field under the event tenant and station name', async () => {
      const event = aWebsocketLifecycleEvent({
        tenantId: 3,
        ocppConnectionName: 'CS-9',
        type: 'Close',
        remoteAddress: '10.0.0.7',
        uri: '/CS-9',
        wsCloseCode: 1000,
        sentCode: 1001,
        closeReason: 'Server shutting down',
        initiator: MessageOrigin.ChargingStationManagementSystem,
        source: 'server_shutdown',
        details: { connectedMs: 1200 },
      });

      await processor.process(event, {});

      expect(call()).toEqual([
        3,
        'CS-9',
        {
          serverId: event.serverId,
          host: event.host,
          remoteAddress: '10.0.0.7',
          uri: '/CS-9',
          type: 'Close',
          timestamp: event.timestamp,
          subprotocol: event.subprotocol,
          httpStatus: undefined,
          wsCloseCode: 1000,
          sentCode: 1001,
          closeReason: 'Server shutting down',
          initiator: MessageOrigin.ChargingStationManagementSystem,
          source: 'server_shutdown',
          details: { connectedMs: 1200 },
        },
      ]);
    });

    it('should pass no station name for an event that never had one', async () => {
      await processor.process(
        aWebsocketLifecycleEvent({
          ocppConnectionName: undefined,
          type: 'UpgradeRejected',
          source: 'tls_handshake_failed',
        }),
        {},
      );

      expect(call()[1]).toBeUndefined();
    });

    it('should hand the persisted id to later processors', async () => {
      const context: MessagesEventContext = {};

      await processor.process(aWebsocketLifecycleEvent(), context);

      expect(context.persistedId).toBe(42);
    });

    it('should propagate a write failure, so the pipeline retries and then dead-letters', async () => {
      websocketEventRepository.createWebsocketEvent.mockRejectedValue(new Error('no partition'));

      await expect(processor.process(aWebsocketLifecycleEvent(), {})).rejects.toThrow(
        'no partition',
      );
    });
  });
});
