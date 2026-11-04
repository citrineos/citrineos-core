// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IMessageContext } from '@citrineos/base';
import {
  AuthorizationAttemptReasonEnum,
  AuthorizationStatusEnum,
  type AuthorizationDto,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import {
  AuthorizationAttemptService,
  remoteStartTarget,
} from '@services/authorization-attempts/index.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

const CONTEXT: IMessageContext = {
  tenantId: 3,
  ocppConnectionName: 'CS-9',
  correlationId: 'corr-1',
  timestamp: '2026-10-16T12:00:00.000Z',
};

const AUTHORIZATION = {
  id: 11,
  idToken: 'TOKEN-1',
  status: AuthorizationStatusEnum.Blocked,
} as AuthorizationDto;

describe('remoteStartTarget', () => {
  it('reads idTag and connectorId from an OCPP 1.6 RemoteStartTransaction', () => {
    expect(
      remoteStartTarget(OCPPVersion.OCPP1_6, OCPP_CallAction.RemoteStartTransaction, {
        idTag: 'TAG-1',
        connectorId: 2,
      }),
    ).toEqual({ idToken: 'TAG-1', connectorId: 2 });
  });

  it('reads the idToken, its type, evseId and remoteStartId from a RequestStartTransaction', () => {
    expect(
      remoteStartTarget(OCPPVersion.OCPP2_1, OCPP_CallAction.RequestStartTransaction, {
        idToken: { idToken: 'TOKEN-1', type: 'ISO14443' },
        evseId: 1,
        remoteStartId: 77,
      }),
    ).toEqual({ idToken: 'TOKEN-1', idTokenType: 'ISO14443', evseId: 1, remoteStartId: 77 });
  });

  it.each([
    ['another action', OCPPVersion.OCPP2_0_1, OCPP_CallAction.GetBaseReport, { requestId: 1 }],
    ['a missing request', OCPPVersion.OCPP1_6, OCPP_CallAction.RemoteStartTransaction, undefined],
    [
      'a 2.x action on 1.6',
      OCPPVersion.OCPP1_6,
      OCPP_CallAction.RequestStartTransaction,
      { idToken: { idToken: 'x', type: 'Central' } },
    ],
  ])('is undefined for %s', (_label, protocol, action, request) => {
    expect(remoteStartTarget(protocol, action, request)).toBeUndefined();
  });
});

describe('AuthorizationAttemptService', () => {
  const { container, logger } = createTestContainer();
  let authorizationAttemptRepository: { createAuthorizationAttempt: Mock };
  let authorizationRepository: { readAllByQuerystring: Mock };
  let service: AuthorizationAttemptService;

  function created(): unknown[] {
    return authorizationAttemptRepository.createAuthorizationAttempt.mock.calls[0];
  }

  beforeEach(() => {
    vi.clearAllMocks();
    authorizationAttemptRepository = {
      createAuthorizationAttempt: vi.fn().mockResolvedValue({ id: 1 }),
    };
    authorizationRepository = { readAllByQuerystring: vi.fn().mockResolvedValue([]) };
    service = getTestInstance(container, AuthorizationAttemptService, {
      authorizationAttemptRepository,
      authorizationRepository,
    });
  });

  describe('record', () => {
    it('stamps the attempt with the message context and snapshots the authorization', async () => {
      const transactionCreatedAt = new Date('2026-10-16T11:59:00.000Z');

      await service.record(CONTEXT, {
        ocppVersion: OCPPVersion.OCPP2_0_1,
        action: OCPP_CallAction.TransactionEvent,
        idToken: 'TOKEN-1',
        idTokenType: 'ISO14443',
        decision: {
          reason: AuthorizationAttemptReasonEnum.StoredStatus,
          authorization: AUTHORIZATION,
        },
        responseStatus: 'Blocked',
        evseId: 1,
        connectorId: 2,
        transaction: { id: 5, createdAt: transactionCreatedAt, transactionId: 'tx-1' },
      });

      expect(created()).toEqual([
        3,
        'CS-9',
        {
          ocppVersion: OCPPVersion.OCPP2_0_1,
          action: OCPP_CallAction.TransactionEvent,
          idToken: 'TOKEN-1',
          idTokenType: 'ISO14443',
          responseStatus: 'Blocked',
          evseId: 1,
          connectorId: 2,
          correlationId: 'corr-1',
          timestamp: '2026-10-16T12:00:00.000Z',
          reason: AuthorizationAttemptReasonEnum.StoredStatus,
          authorizationId: 11,
          storedStatus: AuthorizationStatusEnum.Blocked,
          transactionDatabaseId: 5,
          transactionCreatedAt,
          transactionId: 'tx-1',
        },
      ]);
    });

    it('keeps a transactionId given without a transaction row', async () => {
      await service.record(CONTEXT, {
        ocppVersion: OCPPVersion.OCPP2_0_1,
        action: OCPP_CallAction.TransactionEvent,
        idToken: 'TOKEN-1',
        decision: { reason: AuthorizationAttemptReasonEnum.NotFound },
        transactionId: 'tx-2',
      });

      expect(created()[2]).toMatchObject({
        authorizationId: null,
        storedStatus: null,
        transactionDatabaseId: null,
        transactionCreatedAt: null,
        transactionId: 'tx-2',
      });
    });

    it('logs a failed write instead of throwing it at the caller', async () => {
      authorizationAttemptRepository.createAuthorizationAttempt.mockRejectedValue(
        new Error('no partition for this week'),
      );

      await expect(
        service.record(CONTEXT, {
          ocppVersion: OCPPVersion.OCPP1_6,
          action: OCPP_CallAction.Authorize,
          idToken: 'TAG-1',
          decision: { reason: AuthorizationAttemptReasonEnum.Accepted },
        }),
      ).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('recordRemoteStart', () => {
    const REQUEST = { idToken: { idToken: 'TOKEN-1', type: 'ISO14443' }, remoteStartId: 77 };

    it('links the one Authorization matching the idToken and its type', async () => {
      authorizationRepository.readAllByQuerystring.mockResolvedValue([AUTHORIZATION]);

      await service.recordRemoteStart(
        CONTEXT,
        OCPPVersion.OCPP2_0_1,
        OCPP_CallAction.RequestStartTransaction,
        REQUEST,
        {
          reason: AuthorizationAttemptReasonEnum.StationResponded,
          responseStatus: 'Rejected',
        },
      );

      expect(authorizationRepository.readAllByQuerystring).toHaveBeenCalledWith(3, {
        idToken: 'TOKEN-1',
        type: 'ISO14443',
      });
      expect(created()[2]).toMatchObject({
        action: OCPP_CallAction.RequestStartTransaction,
        idToken: 'TOKEN-1',
        idTokenType: 'ISO14443',
        remoteStartId: 77,
        reason: AuthorizationAttemptReasonEnum.StationResponded,
        responseStatus: 'Rejected',
        authorizationId: 11,
        storedStatus: AuthorizationStatusEnum.Blocked,
      });
    });

    it('records the attempt unlinked when the idToken matches more than one Authorization', async () => {
      authorizationRepository.readAllByQuerystring.mockResolvedValue([
        AUTHORIZATION,
        { ...AUTHORIZATION, id: 12 },
      ]);

      await service.recordRemoteStart(
        CONTEXT,
        OCPPVersion.OCPP2_0_1,
        OCPP_CallAction.RequestStartTransaction,
        REQUEST,
        { reason: AuthorizationAttemptReasonEnum.Timeout },
      );

      expect(created()[2]).toMatchObject({
        reason: AuthorizationAttemptReasonEnum.Timeout,
        authorizationId: null,
      });
    });

    it('records nothing, and warns, when the request it answers is unknown', async () => {
      await service.recordRemoteStart(
        CONTEXT,
        OCPPVersion.OCPP1_6,
        OCPP_CallAction.RemoteStartTransaction,
        undefined,
        { reason: AuthorizationAttemptReasonEnum.StationResponded, responseStatus: 'Accepted' },
      );

      expect(authorizationAttemptRepository.createAuthorizationAttempt).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
