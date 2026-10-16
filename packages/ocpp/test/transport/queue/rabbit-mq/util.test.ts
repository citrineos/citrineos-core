// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { fromAmqpContent, toAmqpContent } from '@/transport/queue/rabbit-mq/util.js';
import { Message, RequestBuilder } from '@citrineos/base';
import {
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  OCPPVersion,
  type OcppRequest,
  type OcppResponse,
} from '@citrineos/types';
import { describe, expect, it } from 'vitest';

describe('AMQP message content', () => {
  const request = { connectorId: 1, idTag: 'TAG' } as OcppRequest;
  const response = { status: 'Accepted' } as OcppResponse;

  it('keeps the request of a CallResult the router built', () => {
    const message = RequestBuilder.buildCallResult(
      'cs-001',
      'corr-1',
      1,
      OCPP_CallAction.RemoteStartTransaction,
      response,
      EventGroup.Router,
      MessageOrigin.ChargingStation,
      OCPPVersion.OCPP1_6,
      new Date('2026-01-01T00:00:00.000Z'),
      request,
    );

    expect(fromAmqpContent(toAmqpContent(message)).request).toEqual(request);
  });

  it('keeps the request of a parsed message that is published again', () => {
    const message = new Message(
      MessageOrigin.ChargingStation,
      EventGroup.Router,
      OCPP_CallAction.RemoteStartTransaction,
      MessageState.Response,
      { ocppConnectionName: 'cs-001', correlationId: 'corr-1', tenantId: 1, timestamp: '' },
      response,
      OCPPVersion.OCPP1_6,
      request,
    );

    expect(fromAmqpContent(toAmqpContent(message)).request).toEqual(request);
  });

  it('leaves request unset on a message that has none', () => {
    const message = RequestBuilder.buildCallResult(
      'cs-001',
      'corr-1',
      1,
      OCPP_CallAction.Heartbeat,
      response,
      EventGroup.Router,
      MessageOrigin.ChargingStation,
      OCPPVersion.OCPP1_6,
    );

    expect(fromAmqpContent(toAmqpContent(message)).request).toBeUndefined();
  });
});
