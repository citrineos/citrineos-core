// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  AuthorizationAttemptReasonEnum,
  CallEventOutcome,
  FrameDirection,
  MessageOrigin,
  MessageTypeId,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import { RemoteStartCallErrorProcessor } from '@modules/messages/processors/remote-start-call-error-processor.js';
import { RemoteStartCallOutcomeProcessor } from '@modules/messages/processors/remote-start-call-outcome-processor.js';
import { RemoteStartDeadLetterProcessor } from '@modules/messages/processors/remote-start-dead-letter-processor.js';
import type { OcppDeadLetterReport } from '@/transport/queue/rabbit-mq/messages/ocpp-dead-letter-consumer.js';
import { aCallEvent, aFrameEvent } from '@test/providers/messages-event-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

const REQUEST = { idToken: { idToken: 'TOKEN-1', type: 'ISO14443' }, remoteStartId: 77 };

describe('RemoteStartCallErrorProcessor', () => {
  const { container } = createTestContainer();
  let authorizationAttemptService: { recordRemoteStart: Mock };
  let ocppMessageRepository: { getRequestByCorrelationId: Mock };
  let processor: RemoteStartCallErrorProcessor;

  const callError = aFrameEvent({
    direction: FrameDirection.Inbound,
    origin: MessageOrigin.ChargingStation,
    type: MessageTypeId.CallError,
    action: undefined,
    correlationId: 'corr-1',
    payload: { errorCode: 'InternalError', errorDescription: 'boom', errorDetails: {} },
  });

  beforeEach(() => {
    authorizationAttemptService = { recordRemoteStart: vi.fn().mockResolvedValue(undefined) };
    ocppMessageRepository = {
      getRequestByCorrelationId: vi.fn().mockResolvedValue({ payload: REQUEST }),
    };
    processor = getTestInstance(container, RemoteStartCallErrorProcessor, {
      authorizationAttemptService,
      ocppMessageRepository,
    });
  });

  it('records a CallError to a remote start with the request it answered', async () => {
    await processor.process(callError, {
      persistedAction: OCPP_CallAction.RequestStartTransaction,
    });

    expect(ocppMessageRepository.getRequestByCorrelationId).toHaveBeenCalledWith(1, 'corr-1');
    expect(authorizationAttemptService.recordRemoteStart).toHaveBeenCalledWith(
      {
        tenantId: 1,
        ocppConnectionName: callError.ocppConnectionName,
        correlationId: 'corr-1',
        timestamp: callError.timestamp,
      },
      OCPPVersion.OCPP2_0_1,
      OCPP_CallAction.RequestStartTransaction,
      REQUEST,
      {
        reason: AuthorizationAttemptReasonEnum.CallError,
        details: { errorCode: 'InternalError', errorDescription: 'boom' },
      },
    );
  });

  it.each([
    ['a CallError to another action', callError, OCPP_CallAction.GetBaseReport],
    [
      'a CallResult',
      { ...callError, type: MessageTypeId.CallResult },
      OCPP_CallAction.RequestStartTransaction,
    ],
    [
      'a CallError the CSMS sent',
      { ...callError, direction: FrameDirection.Outbound },
      OCPP_CallAction.RequestStartTransaction,
    ],
    ['an unresolved action', callError, undefined],
  ])('ignores %s', async (_label, event, persistedAction) => {
    await processor.process(event, { persistedAction });

    expect(authorizationAttemptService.recordRemoteStart).not.toHaveBeenCalled();
  });
});

describe('RemoteStartCallOutcomeProcessor', () => {
  const { container } = createTestContainer();
  let authorizationAttemptService: { recordRemoteStart: Mock };
  let processor: RemoteStartCallOutcomeProcessor;

  beforeEach(() => {
    authorizationAttemptService = { recordRemoteStart: vi.fn().mockResolvedValue(undefined) };
    processor = getTestInstance(container, RemoteStartCallOutcomeProcessor, {
      authorizationAttemptService,
    });
  });

  it.each([
    [CallEventOutcome.Timeout, AuthorizationAttemptReasonEnum.Timeout],
    [CallEventOutcome.SendFailed, AuthorizationAttemptReasonEnum.SendFailed],
  ])('records a remote start that ended in %s', async (outcome, reason) => {
    const event = aCallEvent({
      outcome,
      action: OCPP_CallAction.RemoteStartTransaction,
      protocol: OCPPVersion.OCPP1_6,
      request: { idTag: 'TAG-1', connectorId: 1 },
    });

    await processor.process(event, {});

    expect(authorizationAttemptService.recordRemoteStart).toHaveBeenCalledWith(
      {
        tenantId: event.tenantId,
        ocppConnectionName: event.ocppConnectionName,
        correlationId: event.correlationId,
        timestamp: event.timestamp,
      },
      OCPPVersion.OCPP1_6,
      OCPP_CallAction.RemoteStartTransaction,
      { idTag: 'TAG-1', connectorId: 1 },
      { reason },
    );
  });

  it('ignores any other action', async () => {
    await processor.process(aCallEvent({ action: OCPP_CallAction.GetBaseReport }), {});

    expect(authorizationAttemptService.recordRemoteStart).not.toHaveBeenCalled();
  });
});

describe('RemoteStartDeadLetterProcessor', () => {
  const NOW = '2026-10-16T12:00:00.000Z';
  const { container } = createTestContainer();
  let authorizationAttemptService: { recordRemoteStart: Mock };
  let processor: RemoteStartDeadLetterProcessor;

  function aReport(override?: Partial<OcppDeadLetterReport>): OcppDeadLetterReport {
    return {
      reason: 'stale',
      source: 'router',
      action: OCPP_CallAction.RequestStartTransaction,
      origin: MessageOrigin.ChargingStationManagementSystem,
      tenantId: '3',
      ocppConnectionName: 'CS-9',
      correlationId: 'corr-1',
      body: JSON.stringify({
        _origin: MessageOrigin.ChargingStationManagementSystem,
        _action: OCPP_CallAction.RequestStartTransaction,
        _protocol: OCPPVersion.OCPP2_0_1,
        _payload: REQUEST,
      }),
      ...override,
    };
  }

  beforeEach(() => {
    vi.useFakeTimers({ now: new Date(NOW), toFake: ['Date'] });
    authorizationAttemptService = { recordRemoteStart: vi.fn().mockResolvedValue(undefined) };
    processor = getTestInstance(container, RemoteStartDeadLetterProcessor, {
      authorizationAttemptService,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('records a remote start that was never delivered', async () => {
    await processor.process(aReport());

    expect(authorizationAttemptService.recordRemoteStart).toHaveBeenCalledWith(
      { tenantId: 3, ocppConnectionName: 'CS-9', correlationId: 'corr-1', timestamp: NOW },
      OCPPVersion.OCPP2_0_1,
      OCPP_CallAction.RequestStartTransaction,
      REQUEST,
      {
        reason: AuthorizationAttemptReasonEnum.NotDelivered,
        details: { deadLetterReason: 'stale' },
      },
    );
  });

  it.each([
    ['a reason that is not a delivery failure', aReport({ reason: 'poison' })],
    ['another action', aReport({ action: OCPP_CallAction.GetBaseReport })],
    ['a message from the station', aReport({ origin: MessageOrigin.ChargingStation })],
    ['a report without a tenant', aReport({ tenantId: undefined })],
  ])('ignores %s', async (_label, report) => {
    await processor.process(report);

    expect(authorizationAttemptService.recordRemoteStart).not.toHaveBeenCalled();
  });
});
