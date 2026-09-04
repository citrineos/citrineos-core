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
  type IOcppSender,
  OcppError,
  recordAuthorizeResult,
} from '@citrineos/base';
import {
  AttributeEnum,
  AuthorizationStatusEnum,
  type AuthorizationStatusEnumType,
  AuthorizeCertificateStatusEnum,
  ErrorCode,
  type HandlerProperties,
  IdTokenEnum,
  OCPP2_1,
  OCPP_CallAction,
  type OcppRequest,
  type OcppResponse,
  OCPPVersion,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/types';
import { CertificateAuthorityService } from '@services/index.js';
import { validateOcpp21IdToken } from '@util/index.js';
import {
  type IAuthorizationRepository,
  type IDeviceModelRepository,
  type ITariffRepository,
} from '@citrineos/dal';
import { OCPP2_1_Mapper, VariableAttribute } from '@citrineos/dal';

@AsRequestHandler([OCPPVersion.OCPP2_1], OCPP_CallAction.Authorize)
export class AuthorizeRequestOcpp21Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _certificateAuthorityService: CertificateAuthorityService;
  protected _authorizers: IAuthorizer[];
  protected _authorizationRepository: IAuthorizationRepository;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _tariffRepository: ITariffRepository;

  constructor({
    logger,
    ocppSender,
    certificateAuthorityService,
    authorizers,
    authorizationRepository,
    deviceModelRepository,
    tariffRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    certificateAuthorityService: CertificateAuthorityService;
    authorizers: IAuthorizer[];
    authorizationRepository: IAuthorizationRepository;
    deviceModelRepository: IDeviceModelRepository;
    tariffRepository: ITariffRepository;
  }) {
    super(logger);
    this._ocppSender = ocppSender;
    this._certificateAuthorityService = certificateAuthorityService;
    this._authorizers = authorizers;
    this._authorizationRepository = authorizationRepository;
    this._deviceModelRepository = deviceModelRepository;
    this._tariffRepository = tariffRepository;
  }

  async handle(
    message: IMessage<OCPP2_request_types.AuthorizeRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(this.createHandlerReceivedMessageLog('AuthorizeRequest'), message, props);

    const request: OCPP2_request_types.AuthorizeRequest = message.payload;
    const context = message.context;
    let response = {
      idTokenInfo: {
        status: AuthorizationStatusEnum.Unknown,
      },
    } as OCPP2_response_types.AuthorizeResponse;

    // Validate ID token format after AJV schema validation, checking if the token conforms to expected type
    // e.g. if type is ISO14443, the token should be a hex string of even length
    const tokenValidation = validateOcpp21IdToken(request.idToken.type, request.idToken.idToken);
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

    // Validate Contract Certificates based on OCPP 2.1 Part 2 C07
    if (request.iso15118CertificateHashData || request.certificate) {
      // TODO - implement validation using cached OCSP data described in C07.FR.05
      // If Charging Station is not able to validate a contract certificate,
      // it SHALL pass the contract certificate chain to the CSMS in certificate attribute (in PEM
      // format) of AuthorizeRequest for validation by CSMS, see C07.FR.06
      if (request.certificate) {
        response.certificateStatus =
          await this._certificateAuthorityService.validateCertificateChainPem(request.certificate);
      } else if (request.iso15118CertificateHashData?.length) {
        response.certificateStatus =
          await this._certificateAuthorityService.validateCertificateHashData(
            request.iso15118CertificateHashData,
          );
      }
      if (response.certificateStatus !== AuthorizeCertificateStatusEnum.Accepted) {
        response = {
          ...response,
          idTokenInfo: {
            status: AuthorizationStatusEnum.Invalid,
          },
        } as OCPP2_response_types.AuthorizeResponse;
        const messageConfirmation = await this._sendAuthorizeResult(message, response);
        this._logger.debug(
          this.createHandlerSentMessageLog('Authorize 2.1 Response'),
          messageConfirmation,
        );
        return;
      }
    }

    const authorization = await this._authorizationRepository.readOnlyOneByQuerystring(
      context.tenantId,
      {
        idToken: request.idToken.idToken,
        type: OCPP2_1_Mapper.AuthorizationMapper.fromIdTokenEnumType(request.idToken.type),
      },
    );

    if (authorization) {
      // Use flat fields directly instead of authorization.idTokenInfo
      const idTokenInfo = OCPP2_1_Mapper.AuthorizationMapper.toIdTokenInfo(authorization);
      if (idTokenInfo.status === AuthorizationStatusEnum.Accepted) {
        if (
          idTokenInfo.cacheExpiryDateTime &&
          new Date() > new Date(idTokenInfo.cacheExpiryDateTime)
        ) {
          response = {
            idTokenInfo: {
              status: AuthorizationStatusEnum.Invalid,
              groupIdToken: idTokenInfo.groupIdToken,
            },
          } as OCPP2_response_types.AuthorizeResponse;
        } else {
          let evseIds: Set<number> | undefined = undefined;
          const allowedConnectorTypes = authorization.allowedConnectorTypes ?? [];
          const hasConnectorTypeRestriction = allowedConnectorTypes.length > 0;
          if (hasConnectorTypeRestriction) {
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
              if (allowedConnectorTypes.includes(connectorType.value as string)) {
                evseIds.add(connectorType.component?.evse?.id as number);
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
                const evseIdDisallowed: boolean = authorization.disallowedEvseIdPrefixes.some(
                  (disallowedEvseId: string) =>
                    (evseIdAttribute.value as string).startsWith(disallowedEvseId),
                );
                if (evseIdDisallowed) {
                  evseIds.delete(evseIdAttribute.component?.evse?.id as number);
                } else if (!hasConnectorTypeRestriction) {
                  evseIds.add(evseIdAttribute.component?.evse?.id as number);
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
            OCPP2_1_Mapper.AuthorizationMapper.fromAuthorizationStatusEnumType(result);
        }

        // C17 - Prepaid card authorization (OCPP 2.1 only)
        if (
          authorization.isPrepaid &&
          response.idTokenInfo.status === AuthorizationStatusEnum.Accepted
        ) {
          if (authorization.prepaidBalance != null && authorization.prepaidBalance > 0) {
            // C17.FR.01: Prepaid token with positive balance
            response.idTokenInfo.cacheExpiryDateTime = new Date().toISOString();
            this._logger.debug(
              `C17: Prepaid authorization accepted for idToken ${authorization.idToken} with balance ${authorization.prepaidBalance}`,
            );
          } else {
            // C17.FR.02: Prepaid token with zero or negative balance
            response.idTokenInfo.status =
              OCPP2_1_Mapper.AuthorizationMapper.fromAuthorizationStatusEnumType(
                AuthorizationStatusEnum.NoCredit,
              );
            response.idTokenInfo.cacheExpiryDateTime = new Date().toISOString();
            this._logger.debug(
              `C17: Prepaid authorization rejected (NoCredit) for idToken ${authorization.idToken} with balance ${authorization.prepaidBalance}`,
            );
          }
        }
      } else {
        // Blocked, Expired, Invalid, NoCredit, Unknown
        response.idTokenInfo = idTokenInfo;
      }
    } else {
      // Status is Unknown if no authorization found
      const messageConfirmation = await this._sendAuthorizeResult(message, response);
      this._logger.debug(
        this.createHandlerSentMessageLog('Authorize 2.1 Response'),
        messageConfirmation,
      );
      return;
    }

    if (response.idTokenInfo.status === AuthorizationStatusEnum.Accepted) {
      const tariffEnabled: VariableAttribute[] =
        await this._deviceModelRepository.readAllByQuerystring(context.tenantId, {
          tenantId: context.tenantId,
          ocppConnectionName: message.context.ocppConnectionName,
          component_name: 'TariffCostCtrlr',
          variable_name: 'Enabled',
          variable_instance: 'Tariff',
          type: AttributeEnum.Actual,
        });

      // A device model boolean arrives as the string "false" or "true" (Part 2 §2.1.4), so it
      // has to be compared, not coerced.
      if (tariffEnabled[0]?.value?.toLowerCase() === 'true') {
        if (authorization.tariffId != null) {
          const tariff = await this._tariffRepository.findById(
            context.tenantId,
            authorization.tariffId,
          );
          if (tariff) {
            // I08.FR.09: CSMS SHALL NOT provide validFrom in AuthorizeResponse
            const { validFrom: _, ...tariffForResponse } =
              OCPP2_1_Mapper.TariffMapper.toTariffType(tariff);
            (response as OCPP2_1.AuthorizeResponse).tariff =
              tariffForResponse as OCPP2_1.TariffType;
          }
        }
      }
    }

    const messageConfirmation = await this._sendAuthorizeResult(message, response);
    this._logger.debug(
      this.createHandlerSentMessageLog('Authorize 2.1 Response'),
      messageConfirmation,
    );
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
