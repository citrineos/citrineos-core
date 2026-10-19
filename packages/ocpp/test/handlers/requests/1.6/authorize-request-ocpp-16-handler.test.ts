// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import { type IAuthorizer, type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppRequest,
  AuthorizationAttemptReasonEnum,
  AuthorizationStatusEnum,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { IAuthorizationRepository } from '@citrineos/dal';
import { AuthorizeRequestOcpp16Handler } from '@handlers/index.js';
import {
  createTestContainer,
  makeMockOcppSender,
  makeMockAuthorizationAttemptService,
} from '@test/test-container.js';

function makeMessage<T extends OcppRequest>(payload: T): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: 'station-001',
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.EVDriver,
    action: OCPP_CallAction.Authorize,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP1_6,
  } as unknown as IMessage<T>;
}

function makeHandler(authorizations: unknown[]) {
  const { logger } = createTestContainer();
  const ocppSender = makeMockOcppSender();

  const authorizationRepository = {
    readAllByQuerystring: vi.fn().mockResolvedValue(authorizations),
    readOnlyOneByQuerystring: vi.fn().mockResolvedValue(undefined),
  };

  const authorizer = {
    authorize: vi.fn().mockResolvedValue(AuthorizationStatusEnum.Accepted),
  } as unknown as IAuthorizer;

  const authorizationAttemptService = makeMockAuthorizationAttemptService();

  const handler = new AuthorizeRequestOcpp16Handler({
    authorizationAttemptService,
    logger,
    ocppSender,
    authorizers: [authorizer],
    authorizationRepository: authorizationRepository as unknown as IAuthorizationRepository,
  } as never);

  return { handler, ocppSender, authorizationRepository, authorizer, authorizationAttemptService };
}

/** Pulls the AuthorizeResponse out of the single sendCallResultWithMessage call. */
function sentResponse(
  ocppSender: ReturnType<typeof makeMockOcppSender>,
): OCPP1_6.AuthorizeResponse {
  expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
  return ocppSender.sendCallResultWithMessage.mock.calls[0][1] as OCPP1_6.AuthorizeResponse;
}

const request: OCPP1_6.AuthorizeRequest = { idTag: 'TAG001' };

describe('AuthorizeRequestOcpp16Handler', () => {
  it('accepts an idTag whose authorization is Accepted', async () => {
    const { handler, ocppSender } = makeHandler([
      { idToken: 'TAG001', status: AuthorizationStatusEnum.Accepted },
    ]);

    await handler.handle(makeMessage(request));

    expect(sentResponse(ocppSender).idTagInfo.status).toBe(
      OCPP1_6.AuthorizeResponseStatus.Accepted,
    );
  });

  it('does not accept an idTag whose authorization has no status', async () => {
    const { handler, ocppSender } = makeHandler([{ idToken: 'TAG001', status: undefined }]);

    await handler.handle(makeMessage(request));

    expect(sentResponse(ocppSender).idTagInfo.status).toBe(OCPP1_6.AuthorizeResponseStatus.Invalid);
  });

  it('does not consult the authorizers for an authorization that has no status', async () => {
    const { handler, authorizer } = makeHandler([{ idToken: 'TAG001', status: null }]);

    await handler.handle(makeMessage(request));

    expect(authorizer.authorize).not.toHaveBeenCalled();
  });

  describe('authorization attempts', () => {
    it('records an accepted idTag with the Authorization it matched', async () => {
      const authorization = { id: 4, idToken: 'TAG001', status: AuthorizationStatusEnum.Accepted };
      const { handler, authorizationAttemptService } = makeHandler([authorization]);
      const message = makeMessage(request);

      await handler.handle(message);

      expect(authorizationAttemptService.record).toHaveBeenCalledWith(message.context, {
        ocppVersion: OCPPVersion.OCPP1_6,
        action: OCPP_CallAction.Authorize,
        idToken: 'TAG001',
        decision: { reason: AuthorizationAttemptReasonEnum.Accepted, authorization },
        responseStatus: OCPP1_6.AuthorizeResponseStatus.Accepted,
      });
    });

    it.each([
      ['no Authorization', [], AuthorizationAttemptReasonEnum.NotFound],
      [
        'two Authorizations',
        [{ idToken: 'TAG001' }, { idToken: 'TAG001' }],
        AuthorizationAttemptReasonEnum.MultipleFound,
      ],
      [
        'a Blocked Authorization',
        [{ idToken: 'TAG001', status: AuthorizationStatusEnum.Blocked }],
        AuthorizationAttemptReasonEnum.StoredStatus,
      ],
    ])('records why an idTag with %s was refused', async (_label, authorizations, reason) => {
      const { handler, authorizationAttemptService } = makeHandler(authorizations);

      await handler.handle(makeMessage(request));

      expect(authorizationAttemptService.record).toHaveBeenCalledOnce();
      expect(authorizationAttemptService.record.mock.calls[0][1].decision.reason).toBe(reason);
    });

    it('records an authorizer turning the idTag down', async () => {
      const { handler, authorizer, authorizationAttemptService } = makeHandler([
        { idToken: 'TAG001', status: AuthorizationStatusEnum.Accepted },
      ]);
      vi.mocked(authorizer.authorize).mockResolvedValue(AuthorizationStatusEnum.Blocked);

      await handler.handle(makeMessage(request));

      expect(authorizationAttemptService.record.mock.calls[0][1]).toMatchObject({
        decision: { reason: AuthorizationAttemptReasonEnum.AuthorizerRejected },
        responseStatus: OCPP1_6.AuthorizeResponseStatus.Blocked,
      });
    });
  });
});
