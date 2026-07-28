// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type HandlerProperties,
  type IMessage,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
  type IMessageContext,
  AuthorizationStatusEnum,
  type OcppRequest,
  type OcppResponse,
  type IMessageConfirmation,
  recordAuthorizeResult,
  type AuthorizationStatusEnumType,
  type IAuthorizer,
  type IOcppSender,
} from '@citrineos/base';
import { OCPP1_6_Mapper, type IAuthorizationRepository } from '@/dal/index.js';

@AsRequestHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.Authorize)
export class AuthorizeRequestOcpp16Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _authorizers: IAuthorizer[];
  protected _authorizeRepository: IAuthorizationRepository;

  constructor({
    logger,
    ocppSender,
    authorizers,
    authorizationRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    authorizers: IAuthorizer[];
    authorizationRepository: IAuthorizationRepository;
  }) {
    super(logger);
    this._ocppSender = ocppSender;
    this._authorizers = authorizers;
    this._authorizeRepository = authorizationRepository;
  }

  async handle(
    message: IMessage<OCPP1_6.AuthorizeRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(this.createHandlerReceivedMessageLog('AuthorizeRequest'), message, props);

    const request: OCPP1_6.AuthorizeRequest = message.payload;
    const context: IMessageContext = message.context;

    // Default response: Invalid
    const response: OCPP1_6.AuthorizeResponse = {
      idTagInfo: {
        status: OCPP1_6.AuthorizeResponseStatus.Invalid,
      },
    };
    try {
      const authorizations = await this._authorizeRepository.readAllByQuerystring(
        context.tenantId,
        {
          idToken: request.idTag,
        },
      );
      if (!authorizations || authorizations.length === 0) {
        this._logger.error(`No authorization found for idToken: ${request.idTag}`);
        //below line is just to make it more explicit. Default status is already invalid.
        response.idTagInfo.status = OCPP1_6.AuthorizeResponseStatus.Invalid;
        await this._sendAuthorizeResult(message, response);
        this._logger.debug('Authorize response sent:', response);
        return;
      }
      // If we find more than one token for an idTag it's too opinionated on how to define which one is valid.
      // For now, we error out, and implementers should change this according to their needs.
      if (authorizations.length > 1) {
        this._logger.error(`Too many authorizations found for idToken: ${request.idTag}`);
        response.idTagInfo.status = OCPP1_6.AuthorizeResponseStatus.Invalid;
        await this._sendAuthorizeResult(message, response);
        this._logger.debug('Authorize response sent:', response);
        return;
      }

      const authorization = authorizations[0];

      if (!authorization.status) {
        response.idTagInfo.status = OCPP1_6.AuthorizeResponseStatus.Accepted;
      } else if (authorization.status === AuthorizationStatusEnum.Accepted) {
        const cacheExpiryDateTime = authorization.cacheExpiryDateTime;
        const groupAuthorizationId = authorization.groupAuthorizationId;
        response.idTagInfo.expiryDate = cacheExpiryDateTime;
        if (groupAuthorizationId) {
          // Look up the referenced Authorization for parentIdTag
          const parentAuth = await this._authorizeRepository.readOnlyOneByQuery(
            message.context.tenantId,
            { where: { id: groupAuthorizationId } },
          );
          if (parentAuth) {
            response.idTagInfo.parentIdTag = parentAuth.idToken;
          }
        }
        if (cacheExpiryDateTime && new Date() > new Date(cacheExpiryDateTime)) {
          response.idTagInfo.status = OCPP1_6.AuthorizeResponseStatus.Expired;
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
        }
      }
    } catch (error) {
      // Log any unexpected errors
      this._logger.error(`Failed to retrieve authorization for idToken '${request.idTag}':`, error);
      // response remains "Invalid" by default
    }

    await this._sendAuthorizeResult(message, response).then((messageConfirmation) => {
      this._logger.debug('Authorize response sent:', messageConfirmation);
    });
    return;
  }

  /**
   * Records the Authorize decision, then sends the CallResult.
   */
  private _sendAuthorizeResult(
    message: IMessage<OcppRequest>,
    response: OcppResponse,
  ): Promise<IMessageConfirmation> {
    const status =
      (response as { idTokenInfo?: { status?: unknown } }).idTokenInfo?.status ??
      (response as { idTagInfo?: { status?: unknown } }).idTagInfo?.status;
    recordAuthorizeResult({
      status,
      ocppVersion: String(message.protocol),
      action: 'Authorize',
    });
    return this._ocppSender.sendCallResultWithMessage(message, response);
  }
}
