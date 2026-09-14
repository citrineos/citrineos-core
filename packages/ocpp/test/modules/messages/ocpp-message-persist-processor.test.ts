// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IOCPPMessageRepository } from '@citrineos/dal';
import {
  FrameDirection,
  MessageOrigin,
  MessageState,
  MessageTypeId,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import { OcppMessagePersistProcessor } from '@modules/messages/processors/ocpp-message-persist-processor.js';
import { aFrameEvent } from '@test/providers/messages-event-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('OcppMessagePersistProcessor', () => {
  const { container } = createTestContainer();
  let ocppMessageRepository: { createOCPPMessage: ReturnType<typeof vi.fn> };
  let processor: OcppMessagePersistProcessor;

  function written(): any {
    return ocppMessageRepository.createOCPPMessage.mock.calls[0][1];
  }

  beforeEach(() => {
    ocppMessageRepository = {
      createOCPPMessage: vi.fn().mockResolvedValue({ id: 7, action: OCPP_CallAction.Heartbeat }),
    };
    processor = getTestInstance(container, OcppMessagePersistProcessor, {
      ocppMessageRepository: ocppMessageRepository as unknown as IOCPPMessageRepository,
    });
  });

  // ─── contract ──────────────────────────────────────────────────────────────

  describe('processor contract', () => {
    it('should be critical, because losing an audit row must fail the event', () => {
      expect(processor.critical).toBe(true);
      expect(processor.name).toBe('ocpp-message-persist');
    });
  });

  // ─── mapping ───────────────────────────────────────────────────────────────

  describe('process', () => {
    it('should write the row against the events own tenant', async () => {
      await processor.process(aFrameEvent({ tenantId: 42 }), {});

      expect(ocppMessageRepository.createOCPPMessage).toHaveBeenCalledWith(
        42,
        expect.objectContaining({ tenantId: 42 }),
      );
    });

    it('should map the envelope onto the OCPP message row', async () => {
      const event = aFrameEvent();

      await processor.process(event, {});

      expect(written()).toMatchObject({
        tenantId: event.tenantId,
        ocppConnectionName: event.ocppConnectionName,
        correlationId: event.correlationId,
        origin: MessageOrigin.ChargingStation,
        type: MessageTypeId.Call,
        action: OCPP_CallAction.Heartbeat,
        protocol: OCPPVersion.OCPP2_0_1,
        raw: event.raw,
        payload: event.payload,
        message: event.frame,
        timestamp: event.timestamp,
        state: MessageState.Request,
      });
    });

    it('should record an outbound frame with the CSMS as its origin', async () => {
      await processor.process(
        aFrameEvent({
          direction: FrameDirection.Outbound,
          origin: MessageOrigin.ChargingStationManagementSystem,
        }),
        {},
      );

      expect(written().origin).toBe(MessageOrigin.ChargingStationManagementSystem);
    });

    it('should keep raw as the only faithful record of an unparsed frame', async () => {
      await processor.process(
        aFrameEvent({
          parsed: false,
          raw: 'invalid-json',
          type: undefined,
          action: undefined,
          payload: undefined,
          frame: undefined,
        }),
        {},
      );

      expect(written()).toMatchObject({
        raw: 'invalid-json',
        payload: undefined,
        message: undefined,
        state: MessageState.Unknown,
      });
    });
  });

  // ─── read-after-write ──────────────────────────────────────────────────────

  describe('context hand-off', () => {
    it('should hand back the action the database resolved for a CallResult', async () => {
      ocppMessageRepository.createOCPPMessage.mockResolvedValue({
        id: 9,
        action: OCPP_CallAction.BootNotification,
      });
      const context = {};

      await processor.process(
        aFrameEvent({ type: MessageTypeId.CallResult, action: undefined }),
        context,
      );

      expect(context).toEqual({
        persistedAction: OCPP_CallAction.BootNotification,
        persistedId: 9,
      });
    });

    it('should leave the resolved action undefined when correlation found no CALL', async () => {
      ocppMessageRepository.createOCPPMessage.mockResolvedValue({ id: 9, action: undefined });
      const context = {};

      await processor.process(
        aFrameEvent({ type: MessageTypeId.CallError, action: undefined }),
        context,
      );

      expect(context).toEqual({ persistedAction: undefined, persistedId: 9 });
    });
  });

  // ─── failure ───────────────────────────────────────────────────────────────

  describe('failure', () => {
    it('should propagate a write failure so the pipeline can retry the event', async () => {
      const boom = new Error('unique violation');
      ocppMessageRepository.createOCPPMessage.mockRejectedValue(boom);

      await expect(processor.process(aFrameEvent(), {})).rejects.toBe(boom);
    });
  });

  // ─── deprecated state column ───────────────────────────────────────────────

  describe('messageStateFromType', () => {
    it.each([
      [MessageTypeId.Call, MessageState.Request],
      [MessageTypeId.CallResult, MessageState.Response],
      [MessageTypeId.CallError, MessageState.Response],
      [undefined, MessageState.Unknown],
      [99 as MessageTypeId, MessageState.Unknown],
    ])('should map %s to %s', (type, expected) => {
      expect(OcppMessagePersistProcessor.messageStateFromType(type)).toBe(expected);
    });
  });
});
