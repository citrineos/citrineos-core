// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { childLogger, type IMessageContext } from '@citrineos/base';
import type { IAuthorizationAttemptRepository, IAuthorizationRepository } from '@citrineos/dal';
import {
  type AuthorizationAttemptReason,
  AuthorizationAttemptReasonEnum,
  type AuthorizationDto,
  OCPP1_6,
  OCPP2_request_types,
  OCPP_CallAction,
  OCPPVersion,
  type TransactionDto,
} from '@citrineos/types';
import type { ILogObj, Logger } from 'tslog';

export interface AuthorizationDecision {
  reason: AuthorizationAttemptReason;
  authorization?: AuthorizationDto;
}

export function newAuthorizationDecision(): AuthorizationDecision {
  return { reason: AuthorizationAttemptReasonEnum.Error };
}

export interface AuthorizationAttemptRecord {
  ocppVersion: string;
  action: string;
  idToken: string;
  idTokenType?: string | null;
  decision: AuthorizationDecision;
  responseStatus?: string | null;
  details?: Record<string, unknown> | null;
  evseId?: number | null;
  connectorId?: number | null;
  transaction?: Pick<TransactionDto, 'id' | 'createdAt' | 'transactionId'> | null;
  transactionId?: string | null;
  remoteStartId?: number | null;
}

export type RemoteStartTarget = Pick<
  AuthorizationAttemptRecord,
  'idToken' | 'idTokenType' | 'evseId' | 'connectorId' | 'remoteStartId'
>;

export const REMOTE_START_ACTIONS: ReadonlySet<string> = new Set([
  OCPP_CallAction.RemoteStartTransaction,
  OCPP_CallAction.RequestStartTransaction,
]);

/**
 * Reads the idToken out of a RemoteStartTransaction (1.6) or RequestStartTransaction (2.x) Call.
 * Undefined for any other action, or a payload without an idToken.
 */
export function remoteStartTarget(
  protocol: string,
  action: string,
  request: unknown,
): RemoteStartTarget | undefined {
  if (typeof request !== 'object' || request === null) {
    return undefined;
  }
  if (
    protocol === OCPPVersion.OCPP1_6 &&
    action === OCPP_CallAction.RemoteStartTransaction &&
    'idTag' in request
  ) {
    const remoteStart = request as OCPP1_6.RemoteStartTransactionRequest;
    return { idToken: remoteStart.idTag, connectorId: remoteStart.connectorId ?? null };
  }
  if (
    protocol !== OCPPVersion.OCPP1_6 &&
    action === OCPP_CallAction.RequestStartTransaction &&
    'idToken' in request
  ) {
    const requestStart = request as OCPP2_request_types.RequestStartTransactionRequest;
    return {
      idToken: requestStart.idToken.idToken,
      idTokenType: requestStart.idToken.type,
      evseId: requestStart.evseId ?? null,
      remoteStartId: requestStart.remoteStartId,
    };
  }
  return undefined;
}

export interface RemoteStartOutcome {
  reason: AuthorizationAttemptReason;
  responseStatus?: string | null;
  details?: Record<string, unknown> | null;
  transactionId?: string | null;
}

/**
 * Appends a row to AuthorizationAttempts for each idToken the CSMS evaluates or sends. Recording
 * is best-effort: a failure is logged and never reaches the caller, so it cannot change what the
 * station is told.
 */
export class AuthorizationAttemptService {
  private readonly _authorizationAttemptRepository: IAuthorizationAttemptRepository;
  private readonly _authorizationRepository: IAuthorizationRepository;
  private readonly _logger: Logger<ILogObj>;

  constructor({
    authorizationAttemptRepository,
    authorizationRepository,
    logger,
  }: {
    authorizationAttemptRepository: IAuthorizationAttemptRepository;
    authorizationRepository: IAuthorizationRepository;
    logger?: Logger<ILogObj>;
  }) {
    this._authorizationAttemptRepository = authorizationAttemptRepository;
    this._authorizationRepository = authorizationRepository;
    this._logger = childLogger(logger, this.constructor.name);
  }

  /**
   * Records the outcome of a remote start the CSMS sent. The station decides these, so the
   * Authorization is looked up only to link the attempt to it and capture its status.
   */
  async recordRemoteStart(
    context: IMessageContext,
    protocol: string,
    action: string,
    request: unknown,
    outcome: RemoteStartOutcome,
  ): Promise<void> {
    const target = remoteStartTarget(protocol, action, request);
    if (!target) {
      this._logger.warn(
        `Cannot record ${action} authorization attempt ${context.correlationId} ` +
          `for ${context.ocppConnectionName}: the request it answers is not available`,
      );
      return;
    }
    const decision: AuthorizationDecision = { reason: outcome.reason };
    try {
      const authorizations = await this._authorizationRepository.readAllByQuerystring(
        context.tenantId,
        target.idTokenType
          ? { idToken: target.idToken, type: target.idTokenType }
          : { idToken: target.idToken },
      );
      if (authorizations.length === 1) {
        decision.authorization = authorizations[0];
      }
    } catch (error) {
      this._logger.error(`Failed to look up the Authorization for ${action}`, error);
    }
    await this.record(context, {
      ...target,
      ocppVersion: protocol,
      action,
      decision,
      responseStatus: outcome.responseStatus,
      details: outcome.details,
      transactionId: outcome.transactionId,
    });
  }

  async record(context: IMessageContext, attempt: AuthorizationAttemptRecord): Promise<void> {
    const { decision, transaction, ...fields } = attempt;
    try {
      await this._authorizationAttemptRepository.createAuthorizationAttempt(
        context.tenantId,
        context.ocppConnectionName,
        {
          ...fields,
          correlationId: context.correlationId,
          timestamp: context.timestamp,
          reason: decision.reason,
          authorizationId: decision.authorization?.id ?? null,
          storedStatus: decision.authorization?.status ?? null,
          transactionDatabaseId: transaction?.id ?? null,
          transactionCreatedAt: transaction?.createdAt ?? null,
          transactionId: transaction?.transactionId ?? fields.transactionId ?? null,
        },
      );
    } catch (error) {
      this._logger.error(
        `Failed to record ${attempt.action} authorization attempt ${context.correlationId} ` +
          `for ${context.ocppConnectionName}`,
        error,
      );
    }
  }
}
