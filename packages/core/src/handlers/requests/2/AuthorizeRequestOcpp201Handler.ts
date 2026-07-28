// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  AttributeEnum,
  AuthorizationStatusEnum,
  type AuthorizationStatusEnumType,
  AuthorizeCertificateStatusEnum,
  ErrorCode,
  type HandlerProperties,
  type IAuthorizer,
  IdTokenEnum,
  type IMessage,
  type IMessageConfirmation,
  OCPP2_request_types,
  OCPP2_response_types,
  OCPP_CallAction,
  OCPP2_0_1,
  OcppError,
  type OcppRequest,
  type OcppResponse,
  OCPPVersion,
  recordAuthorizeResult,
  type IOcppSender,
} from '@citrineos/base';
import { CertificateAuthorityService, validateIdToken } from '@/util/index.js';
import {
  type IAuthorizationRepository,
  type IDeviceModelRepository,
  OCPP2_0_1_Mapper,
  VariableAttribute,
} from '@/dal/index.js';

@AsRequestHandler([OCPPVersion.OCPP2_0_1], OCPP_CallAction.Authorize)
export class AuthorizeRequestOcpp201Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _certificateAuthorityService: CertificateAuthorityService;
  protected _authorizers: IAuthorizer[];
  protected _authorizeRepository: IAuthorizationRepository;
  protected _deviceModelRepository: IDeviceModelRepository;

  constructor({
    logger,
    ocppSender,
    certificateAuthorityService,
    authorizers,
    authorizationRepository,
    deviceModelRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    certificateAuthorityService: CertificateAuthorityService;
    authorizers: IAuthorizer[];
    authorizationRepository: IAuthorizationRepository;
    deviceModelRepository: IDeviceModelRepository;
  }) {
    super(logger);
    this._ocppSender = ocppSender;
    this._certificateAuthorityService = certificateAuthorityService;
    this._authorizers = authorizers;
    this._authorizeRepository = authorizationRepository;
    this._deviceModelRepository = deviceModelRepository;
  }

  async handle(
    message: IMessage<OCPP2_request_types.AuthorizeRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(this.createHandlerReceivedMessageLog('AuthorizeRequest'), message, props);

    const request = message.payload as OCPP2_0_1.AuthorizeRequest;
    const context = message.context;
    let response = {
      idTokenInfo: {
        status: AuthorizationStatusEnum.Unknown,
        // TODO determine how/if to set personalMessage
      },
    } as OCPP2_response_types.AuthorizeResponse;

    // Validate ID token format after AJV schema validation, checking if the token conforms to expected type e.g. if
    // type is ISO14443, the token should be a hex string of even length
    const tokenValidation = validateIdToken(request.idToken.type, request.idToken.idToken);
    if (!tokenValidation.isValid) {
      this._logger.warn(`Invalid ID token format`, {
        type: request.idToken.type,
        token: request.idToken.idToken,
        error: tokenValidation.errorMessage,
      });
      const messageId = message.context.correlationId;
      const error = new OcppError(
        messageId,
        ErrorCode.PropertyConstraintViolation,
        tokenValidation.errorMessage || 'Invalid token value for specified type',
      );
      response = {
        ...response,
        idTokenInfo: {
          status: AuthorizationStatusEnum.Invalid,
        },
      } as OCPP2_response_types.AuthorizeResponse;

      this._logger.error('Token validation failed:', tokenValidation.errorMessage);
      await this._ocppSender.sendCallErrorWithMessage(message, error);
      return;
    }

    if (message.payload.idToken.type === IdTokenEnum.NoAuthorization) {
      response = {
        ...response,
        idTokenInfo: {
          status: AuthorizationStatusEnum.Accepted,
        },
      } as OCPP2_response_types.AuthorizeResponse;
      await this._sendAuthorizeResult(message, response);
      return;
    }

    // Validate Contract Certificates based on OCPP 2.0.1 Part 2 C07
    if (request.iso15118CertificateHashData || request.certificate) {
      // TODO - implement validation using cached OCSP data described in C07.FR.05
      if (request.iso15118CertificateHashData && request.iso15118CertificateHashData.length > 0) {
        response.certificateStatus =
          await this._certificateAuthorityService.validateCertificateHashData(
            request.iso15118CertificateHashData,
          );
      }
      // If Charging Station is not able to validate a contract certificate,
      // it SHALL pass the contract certificate chain to the CSMS in certificate attribute (in PEM
      // format) of AuthorizeRequest for validation by CSMS, see C07.FR.06
      if (request.certificate) {
        response.certificateStatus =
          await this._certificateAuthorityService.validateCertificateChainPem(request.certificate);
      }
      if (response.certificateStatus !== AuthorizeCertificateStatusEnum.Accepted) {
        response = {
          ...response,
          idTokenInfo: {
            status: AuthorizationStatusEnum.Invalid,
          },
        } as OCPP2_response_types.AuthorizeResponse;
        const messageConfirmation = await this._sendAuthorizeResult(message, response);
        this._logger.debug('Authorize response sent:', messageConfirmation);
        return;
      }
    }

    const authorization = await this._authorizeRepository.readOnlyOneByQuerystring(
      context.tenantId,
      {
        idToken: request.idToken.idToken,
        type: OCPP2_0_1_Mapper.AuthorizationMapper.fromIdTokenEnumType(request.idToken.type),
      },
    );

    if (authorization) {
      // Use flat fields directly instead of authorization.idTokenInfo
      const idTokenInfo = OCPP2_0_1_Mapper.AuthorizationMapper.toIdTokenInfo(authorization);
      if (idTokenInfo.status === AuthorizationStatusEnum.Accepted) {
        if (
          idTokenInfo.cacheExpiryDateTime &&
          new Date() > new Date(idTokenInfo.cacheExpiryDateTime)
        ) {
          response = {
            idTokenInfo: {
              status: AuthorizationStatusEnum.Invalid,
              groupIdToken: idTokenInfo.groupIdToken,
              // TODO determine how/if to set personalMessage
            },
          } as OCPP2_response_types.AuthorizeResponse;
        } else {
          // If charging station does not have values and evses associated with the component/variable pairs below,
          // this logic will break. CSMS's aiming to use the allowedConnectorTypes or disallowedEvseIdPrefixes
          // Authorization restrictions MUST provide these variable attributes as defined in Physical Component
          // list of Part 2 - Appendices of OCPP 2.0.1
          let evseIds: Set<number> | undefined = undefined;
          if (
            authorization.allowedConnectorTypes &&
            authorization.allowedConnectorTypes.length > 0
          ) {
            evseIds = new Set();
            const connectorTypes: VariableAttribute[] =
              await this._deviceModelRepository.readAllByQuerystring(context.tenantId, {
                tenantId: context.tenantId,
                ocppConnectionName: message.context.ocppConnectionName,
                component_name: 'Connector',
                variable_name: 'ConnectorType',
                type: AttributeEnum.Actual,
              });
            for (const connectorType of connectorTypes) {
              if (authorization.allowedConnectorTypes.indexOf(connectorType.value as string) > 0) {
                evseIds.add(connectorType.evse?.id as number);
              }
            }
          }
          if (evseIds && evseIds.size === 0) {
            response = {
              idTokenInfo: {
                status: AuthorizationStatusEnum.NotAllowedTypeEVSE,
                groupIdToken: idTokenInfo.groupIdToken,
                // TODO determine how/if to set personalMessage
              },
            } as OCPP2_response_types.AuthorizeResponse;
          } else {
            if (
              authorization.disallowedEvseIdPrefixes &&
              authorization.disallowedEvseIdPrefixes.length > 0
            ) {
              evseIds = evseIds ? evseIds : new Set();
              const evseIdAttributes: VariableAttribute[] =
                await this._deviceModelRepository.readAllByQuerystring(context.tenantId, {
                  tenantId: context.tenantId,
                  ocppConnectionName: message.context.ocppConnectionName,
                  component_name: 'EVSE',
                  variable_name: 'EvseId',
                  type: AttributeEnum.Actual,
                });
              for (const evseIdAttribute of evseIdAttributes) {
                const evseIdAllowed: boolean = authorization.disallowedEvseIdPrefixes.some(
                  (disallowedEvseId: string) =>
                    (evseIdAttribute.value as string).startsWith(disallowedEvseId),
                );
                if (evseIdAllowed && !authorization.allowedConnectorTypes) {
                  evseIds.add(evseIdAttribute.evse?.id as number);
                } else if (!evseIdAllowed && authorization.allowedConnectorTypes) {
                  evseIds.delete(evseIdAttribute.evse?.id as number);
                }
              }
            }
            if (evseIds && evseIds.size === 0) {
              response = {
                idTokenInfo: {
                  status: AuthorizationStatusEnum.NotAtThisLocation,
                  groupIdToken: idTokenInfo.groupIdToken,
                  // TODO determine how/if to set personalMessage
                },
              } as OCPP2_response_types.AuthorizeResponse;
            } else {
              // TODO: Determine how to check for NotAtThisTime
              response.idTokenInfo = idTokenInfo;
              const evseId: number[] = [...(evseIds ? evseIds.values() : [])];
              if (evseId.length > 0) {
                response.idTokenInfo.evseId = [evseId.pop() as number, ...evseId];
              }
            }
          }
        }

        for (const authorizer of this._authorizers) {
          if (response.idTokenInfo.status !== AuthorizationStatusEnum.Accepted) {
            break;
          }
          const result: AuthorizationStatusEnumType = await authorizer.authorize(
            authorization,
            context,
          );
          response.idTokenInfo.status =
            OCPP2_0_1_Mapper.AuthorizationMapper.fromAuthorizationStatusEnumType(result);
        }
      } else {
        // Blocked, Expired, Invalid, NoCredit, Unknown
        response.idTokenInfo = idTokenInfo;
      }
    } else {
      // Status is Unknown if no authorization found
      const messageConfirmation = await this._sendAuthorizeResult(message, response);
      this._logger.debug('Authorize response sent:', messageConfirmation);
      return;
    }

    if (response.idTokenInfo.status === AuthorizationStatusEnum.Accepted) {
      const tariffAvailable: VariableAttribute[] =
        await this._deviceModelRepository.readAllByQuerystring(context.tenantId, {
          tenantId: context.tenantId,
          ocppConnectionName: message.context.ocppConnectionName,
          component_name: 'TariffCostCtrlr',
          variable_name: 'Available',
          variable_instance: 'Tariff',
          type: AttributeEnum.Actual,
        });

      const displayMessageAvailable: VariableAttribute[] =
        await this._deviceModelRepository.readAllByQuerystring(context.tenantId, {
          tenantId: context.tenantId,
          ocppConnectionName: message.context.ocppConnectionName,
          component_name: 'DisplayMessageCtrlr',
          variable_name: 'Available',
          type: AttributeEnum.Actual,
        });

      // only send the tariff information if the Charging Station supports the tariff or DisplayMessage functionality
      if (
        (tariffAvailable.length > 0 && Boolean(tariffAvailable[0].value)) ||
        (displayMessageAvailable.length > 0 && Boolean(displayMessageAvailable[0].value))
      ) {
        // TODO: The OCPP 2.0.1 Authorize request pricing message requires EV Driver specific pricing, which is not yet supported.
      }
    }

    const messageConfirmation = await this._sendAuthorizeResult(message, response);
    this._logger.debug('Authorize response sent:', messageConfirmation);
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
