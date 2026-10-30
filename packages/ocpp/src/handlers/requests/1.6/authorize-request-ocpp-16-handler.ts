// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type IAuthorizer,
  type IMessage,
  type IMessageConfirmation,
  type IMessageContext,
  type IOcppSender,
  recordAuthorizeResult,
} from '@citrineos/base';
import {
  AuthorizationAttemptReasonEnum,
  AuthorizationStatusEnum,
  type AuthorizationStatusEnumType,
  type HandlerProperties,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import { type IAuthorizationRepository, OCPP1_6_Mapper } from '@citrineos/dal';
import {
  type AuthorizationAttemptService,
  type AuthorizationDecision,
  newAuthorizationDecision,
} from '@services/authorization-attempts/index.js';

@AsRequestHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.Authorize)
export class AuthorizeRequestOcpp16Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _authorizers: IAuthorizer[];
  protected _authorizationRepository: IAuthorizationRepository;
  protected _authorizationAttemptService: Pick<AuthorizationAttemptService, 'record'>;

  constructor({
    logger,
    ocppSender,
    authorizers,
    authorizationRepository,
    authorizationAttemptService,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    authorizers: IAuthorizer[];
    authorizationRepository: IAuthorizationRepository;
    authorizationAttemptService: Pick<AuthorizationAttemptService, 'record'>;
  }) {
    super(logger);
    this._ocppSender = ocppSender;
    this._authorizers = authorizers;
    this._authorizationRepository = authorizationRepository;
    this._authorizationAttemptService = authorizationAttemptService;
  }

  async handle(
    message: IMessage<OCPP1_6.AuthorizeRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(this.createHandlerReceivedMessageLog('AuthorizeRequest'), message, props);

    const request: OCPP1_6.AuthorizeRequest = message.payload;
    const context: IMessageContext = message.context;

    const decision = newAuthorizationDecision();
    // Default response: Invalid
    const response: OCPP1_6.AuthorizeResponse = {
      idTagInfo: {
        status: OCPP1_6.AuthorizeResponseStatus.Invalid,
      },
    };
    try {
      const authorizations = await this._authorizationRepository.readAllByQuerystring(
        context.tenantId,
        {
          idToken: request.idTag,
        },
      );
      if (!authorizations || authorizations.length === 0) {
        this._logger.error(`No authorization found for idToken: ${request.idTag}`);
        //below line is just to make it more explicit. Default status is already invalid.
        response.idTagInfo.status = OCPP1_6.AuthorizeResponseStatus.Invalid;
        decision.reason = AuthorizationAttemptReasonEnum.NotFound;
        await this._sendAuthorizeResult(message, response, decision);
        this._logger.debug(this.createHandlerSentMessageLog('AuthorizeResponse'), response);
        return;
      }
      // If we find more than one token for an idTag it's too opinionated on how to define which one is valid.
      // For now, we error out, and implementers should change this according to their needs.
      if (authorizations.length > 1) {
        this._logger.error(`Too many authorizations found for idToken: ${request.idTag}`);
        response.idTagInfo.status = OCPP1_6.AuthorizeResponseStatus.Invalid;
        decision.reason = AuthorizationAttemptReasonEnum.MultipleFound;
        await this._sendAuthorizeResult(message, response, decision);
        this._logger.debug(this.createHandlerSentMessageLog('AuthorizeResponse'), response);
        return;
      }

      const authorization = authorizations[0];
      decision.authorization = authorization;

      if (!authorization.status) {
        this._logger.error(`Authorization for idToken ${request.idTag} has no status; rejecting.`);
        decision.reason = AuthorizationAttemptReasonEnum.StoredStatus;
      } else if (authorization.status === AuthorizationStatusEnum.Accepted) {
        const cacheExpiryDateTime = authorization.cacheExpiryDateTime;
        const groupAuthorizationId = authorization.groupAuthorizationId;
        response.idTagInfo.expiryDate = cacheExpiryDateTime;
        if (groupAuthorizationId) {
          // Look up the referenced Authorization for parentIdTag
          const parentAuth = await this._authorizationRepository.readOnlyOneByQuerystring(
            message.context.tenantId,
            { id: groupAuthorizationId },
          );
          if (parentAuth) {
            response.idTagInfo.parentIdTag = parentAuth.idToken;
          }
        }
        if (cacheExpiryDateTime && new Date() > new Date(cacheExpiryDateTime)) {
          response.idTagInfo.status = OCPP1_6.AuthorizeResponseStatus.Expired;
          decision.reason = AuthorizationAttemptReasonEnum.CacheExpired;
        } else {
          // Apply authorizers
          let status: AuthorizationStatusEnumType = authorization.status;
          for (const authorizer of this._authorizers) {
            if (status !== AuthorizationStatusEnum.Accepted) {
              break;
            }
            status = await authorizer.authorize(authorization, context);
          }
          response.idTagInfo.status = OCPP1_6_Mapper.AuthorizationMapper.toIdTagInfoStatus(status);
          decision.reason =
            status === AuthorizationStatusEnum.Accepted
              ? AuthorizationAttemptReasonEnum.Accepted
              : AuthorizationAttemptReasonEnum.AuthorizerRejected;
        }
      } else {
        // Stored non-Accepted status (Blocked / Expired / ConcurrentTx / Invalid, etc.)
        // Map it directly from stored state — no IAuthorizer required.
        response.idTagInfo.status = OCPP1_6_Mapper.AuthorizationMapper.toIdTagInfoStatus(
          authorization.status,
        );
        decision.reason = AuthorizationAttemptReasonEnum.StoredStatus;
      }
    } catch (error) {
      // Log any unexpected errors
      this._logger.error(`Failed to retrieve authorization for idToken '${request.idTag}':`, error);
      // response remains "Invalid" by default
    }

    await this._sendAuthorizeResult(message, response, decision).then((messageConfirmation) => {
      this._logger.debug(
        this.createHandlerSentMessageLog('AuthorizeResponse'),
        messageConfirmation,
      );
    });
    return;
  }

  /**
   * Records the Authorize decision, then sends the CallResult.
   */
  private async _sendAuthorizeResult(
    message: IMessage<OCPP1_6.AuthorizeRequest>,
    response: OCPP1_6.AuthorizeResponse,
    decision: AuthorizationDecision,
  ): Promise<IMessageConfirmation> {
    // Sending replaces the message's payload and context with the response's.
    const { context, payload: request } = message;
    recordAuthorizeResult({
      status: response.idTagInfo.status,
      ocppVersion: String(message.protocol),
      action: 'Authorize',
    });
    const confirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    await this._authorizationAttemptService.record(context, {
      ocppVersion: message.protocol,
      action: OCPP_CallAction.Authorize,
      idToken: request.idTag,
      decision,
      responseStatus: response.idTagInfo.status,
    });
    return confirmation;
  }
}
