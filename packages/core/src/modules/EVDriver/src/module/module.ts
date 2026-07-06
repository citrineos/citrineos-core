// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  AuthorizationStatusEnumType,
  CallAction,
  HandlerProperties,
  IAuthorizer,
  IMessage,
  IMessageContext,
  IVatProvider,
  OcppModuleDependencies,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPP2_response_types,
  ReservationUpdateStatusEnumType,
  ReserveNowStatusEnumType,
} from '@citrineos/base';
import {
  AbstractModule,
  AsHandler,
  AttributeEnum,
  AuthorizationStatusEnum,
  AuthorizeCertificateStatusEnum,
  CancelReservationStatusEnum,
  ChargingLimitSourceEnum,
  ChargingProfilePurposeEnum,
  ChargingStationSequenceTypeEnum,
  ErrorCode,
  EventGroup,
  IdTokenEnum,
  MessageOrigin,
  OCPP1_6,
  OCPP2_0_1,
  OCPP2_1,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OcppError,
  OCPPVersion,
  RequestStartStopStatusEnum,
  ReservationUpdateStatusEnum,
  ReserveNowStatusEnum,
  SendLocalListStatusEnum,
} from '@citrineos/base';
import type {
  IAuthorizationRepository,
  IChargingProfileRepository,
  IDeviceModelRepository,
  ILocalAuthListRepository,
  ILocationRepository,
  IOCPPMessageRepository,
  IReservationRepository,
  ITariffRepository,
  ITransactionEventRepository,
} from '@dal/interfaces/repositories.js';
import {
  OCPP1_6_Mapper,
  OCPP2_0_1_Mapper,
  OCPP2_1_Mapper,
  VariableAttribute,
} from '@dal/layers/sequelize/index.js';

import {
  CertificateAuthorityService,
  IdGenerator,
  validateIdToken,
  validateOcpp21IdToken,
} from '@util/index.js';

import type { LocalAuthListService } from './LocalAuthListService.js';

export interface EVDriverModuleDependencies extends OcppModuleDependencies {
  authorizationRepository: IAuthorizationRepository;
  localAuthListRepository: ILocalAuthListRepository;
  deviceModelRepository: IDeviceModelRepository;
  tariffRepository: ITariffRepository;
  transactionEventRepository: ITransactionEventRepository;
  chargingProfileRepository: IChargingProfileRepository;
  reservationRepository: IReservationRepository;
  ocppMessageRepository: IOCPPMessageRepository;
  locationRepository: ILocationRepository;
  certificateAuthorityService: CertificateAuthorityService;
  realTimeAuthorizer: IAuthorizer;
  authorizers: IAuthorizer[];
  idGenerator: IdGenerator;
  localAuthListService: LocalAuthListService;
  viesVatProvider: IVatProvider;
}

/**
 * Component that handles provisioning related messages.
 */
export class EVDriverModule extends AbstractModule {
  /**
   * Fields
   */

  _requests: CallAction[] = [];

  _responses: CallAction[] = [];
  protected _tariffRepository: ITariffRepository;
  protected _locationRepository: ILocationRepository;
  private _certificateAuthorityService: CertificateAuthorityService;
  private _authorizers: IAuthorizer[];
  private _vatProvider?: IVatProvider;
  private _idGenerator: IdGenerator;

  constructor({
    config,
    cache,
    sender,
    handler,
    logger,
    ocppValidator,
    authorizationRepository,
    localAuthListRepository,
    deviceModelRepository,
    tariffRepository,
    transactionEventRepository,
    chargingProfileRepository,
    reservationRepository,
    ocppMessageRepository,
    locationRepository,
    certificateAuthorityService,
    realTimeAuthorizer,
    authorizers,
    idGenerator,
    localAuthListService,
    viesVatProvider,
  }: EVDriverModuleDependencies) {
    super(config, cache, handler, sender, EventGroup.EVDriver, logger, ocppValidator);

    this._requests = config.modules.evdriver.requests;
    this._responses = config.modules.evdriver.responses;

    this._authorizeRepository = authorizationRepository;
    this._localAuthListRepository = localAuthListRepository;
    this._deviceModelRepository = deviceModelRepository;
    this._tariffRepository = tariffRepository;
    this._transactionEventRepository = transactionEventRepository;
    this._chargingProfileRepository = chargingProfileRepository;
    this._reservationRepository = reservationRepository;
    this._ocppMessageRepository = ocppMessageRepository;
    this._locationRepository = locationRepository;
    this._certificateAuthorityService = certificateAuthorityService;

    this._localAuthListService = localAuthListService;

    this._authorizers = [realTimeAuthorizer, ...authorizers];
    this._idGenerator = idGenerator;
    this._vatProvider = viesVatProvider;
  }

  protected _authorizeRepository: IAuthorizationRepository;

  get authorizeRepository(): IAuthorizationRepository {
    return this._authorizeRepository;
  }

  protected _localAuthListRepository: ILocalAuthListRepository;

  get localAuthListRepository(): ILocalAuthListRepository {
    return this._localAuthListRepository;
  }

  protected _deviceModelRepository: IDeviceModelRepository;

  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }

  protected _transactionEventRepository: ITransactionEventRepository;

  get transactionEventRepository(): ITransactionEventRepository {
    return this._transactionEventRepository;
  }

  protected _chargingProfileRepository: IChargingProfileRepository;

  get chargingProfileRepository(): IChargingProfileRepository {
    return this._chargingProfileRepository;
  }

  protected _reservationRepository: IReservationRepository;

  get reservationRepository(): IReservationRepository {
    return this._reservationRepository;
  }

  protected _ocppMessageRepository: IOCPPMessageRepository;

  get ocppMessageRepository(): IOCPPMessageRepository {
    return this._ocppMessageRepository;
  }

  private _localAuthListService: LocalAuthListService;

  get localAuthListService(): LocalAuthListService {
    return this._localAuthListService;
  }

  /**
   * Handle OCPP 2.x requests
   */

  @AsHandler([OCPPVersion.OCPP2_0_1], OCPP_CallAction.Authorize)
  protected async _handleAuthorize(
    message: IMessage<OCPP2_request_types.AuthorizeRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Authorize received:', message, props);
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
      await this.sendCallErrorWithMessage(message, error);
      return;
    }

    if (message.payload.idToken.type === IdTokenEnum.NoAuthorization) {
      response = {
        ...response,
        idTokenInfo: {
          status: AuthorizationStatusEnum.Accepted,
        },
      } as OCPP2_response_types.AuthorizeResponse;
      await this.sendCallResultWithMessage(message, response);
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
        const messageConfirmation = await this.sendCallResultWithMessage(message, response);
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
                  (disallowedEvseId) =>
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
      const messageConfirmation = await this.sendCallResultWithMessage(message, response);
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

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('Authorize response sent:', messageConfirmation);
  }

  @AsHandler([OCPPVersion.OCPP2_1], OCPP_CallAction.Authorize)
  protected async _handleOcpp21Authorize(
    message: IMessage<OCPP2_request_types.AuthorizeRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('OCPP 2.1 Authorize received:', message, props);

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
      await this.sendCallErrorWithMessage(message, error);
      return;
    }

    if (message.payload.idToken.type === IdTokenEnum.NoAuthorization) {
      response = {
        ...response,
        idTokenInfo: {
          status: AuthorizationStatusEnum.Accepted,
        },
      } as OCPP2_response_types.AuthorizeResponse;
      await this.sendCallResultWithMessage(message, response);
      return;
    }

    // Validate Contract Certificates based on OCPP 2.1 Part 2 C07
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
        const messageConfirmation = await this.sendCallResultWithMessage(message, response);
        this._logger.debug('Authorize 2.1 response sent:', messageConfirmation);
        return;
      }
    }

    const authorization = await this._authorizeRepository.readOnlyOneByQuerystring(
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
                  (disallowedEvseId) =>
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
              OCPP2_0_1_Mapper.AuthorizationMapper.fromAuthorizationStatusEnumType(
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
      const messageConfirmation = await this.sendCallResultWithMessage(message, response);
      this._logger.debug('Authorize 2.1 response sent:', messageConfirmation);
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

      if (tariffEnabled.length > 0 && Boolean(tariffEnabled[0].value)) {
        if (authorization.tariffId != null) {
          const tariff = await this._tariffRepository.readByKey(
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

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('Authorize 2.1 response sent:', messageConfirmation);
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.ReservationStatusUpdate)
  protected async _handleReservationStatusUpdate(
    message: IMessage<OCPP2_request_types.ReservationStatusUpdateRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('ReservationStatusUpdateRequest received:', message, props);

    try {
      const status = message.payload.reservationUpdateStatus as ReservationUpdateStatusEnumType;
      const reservation = await this._reservationRepository.readOnlyOneByQuery(
        message.context.tenantId,
        {
          where: {
            tenantId: message.context.tenantId,
            ocppConnectionName: message.context.ocppConnectionName,
            id: message.payload.reservationId,
          },
        },
      );
      if (reservation) {
        if (
          status === ReservationUpdateStatusEnum.Expired ||
          status === ReservationUpdateStatusEnum.Removed
        ) {
          await this._reservationRepository.updateByKey(
            message.context.tenantId,
            {
              isActive: false,
            },
            reservation.databaseId.toString(),
          );
        }
      } else {
        throw new Error(`Reservation ${message.payload.reservationId} not found`);
      }
    } catch (error) {
      this._logger.error('Error reading reservation:', error);
    }

    // Create response
    const response: OCPP2_response_types.ReservationStatusUpdateResponse = {};

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('ReservationStatusUpdate response sent: ', messageConfirmation);
  }

  @AsHandler([OCPPVersion.OCPP2_1], OCPP_CallAction.VatNumberValidation)
  protected async _handleVatNumberValidation(
    message: IMessage<OCPP2_1.VatNumberValidationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('VatNumberValidation request received:', message, props);

    const request = message.payload;

    const company = this._vatProvider ? await this._vatProvider.getVat(request.vatNumber) : null;

    const response: OCPP2_1.VatNumberValidationResponse = {
      vatNumber: request.vatNumber,
      evseId: request.evseId,
      status: company
        ? OCPP2_1.GenericStatusEnumType.Accepted
        : OCPP2_1.GenericStatusEnumType.Rejected,
      company,
    };

    const messageConfirmation = await this.sendCallResultWithMessage(message, response);
    this._logger.debug('VatNumberValidation response sent: ', messageConfirmation);
  }

  /**
   * Handle OCPP 2.x responses
   */

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.RequestStartTransaction)
  protected async _handleRequestStartTransaction(
    message: IMessage<OCPP2_response_types.RequestStartTransactionResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('RequestStartTransactionResponse received:', message, props);
    if (message.payload.status === RequestStartStopStatusEnum.Accepted) {
      // Start transaction with charging profile succeeds,
      // we need to update db entity with the latest data from charger
      const ocppConnectionName: string = message.context.ocppConnectionName;
      // 1. Clear all existing profiles: find existing active profiles and set them to isActive false
      await this._chargingProfileRepository.updateAllByQuery(
        message.context.tenantId,
        {
          isActive: false,
        },
        {
          where: {
            ocppConnectionName: ocppConnectionName,
            isActive: true,
            chargingLimitSource: ChargingLimitSourceEnum.CSO,
            chargingProfilePurpose: ChargingProfilePurposeEnum.TxProfile,
          },
          returning: false,
        },
      );
      // 2. Request charging profiles to get the latest data (if configured)
      if (this._config.modules.evdriver.enableGetChargingProfilesOnStartTransaction !== false) {
        await this.sendCall(
          ocppConnectionName,
          message.context.tenantId,
          message.protocol,
          OCPP_CallAction.GetChargingProfiles,
          {
            requestId: await this._idGenerator.generateRequestId(
              message.context.tenantId,
              message.context.ocppConnectionName,
              ChargingStationSequenceTypeEnum.getChargingProfiles,
            ),
            chargingProfile: {
              chargingProfilePurpose: ChargingProfilePurposeEnum.TxProfile,
              chargingLimitSource: [ChargingLimitSourceEnum.CSO],
            } as OCPP2_common_types.ChargingProfileCriterionType,
          } as OCPP2_request_types.GetChargingProfilesRequest,
        );
      } else {
        this._logger.info(
          `Skipping GetChargingProfiles after RequestStartTransaction for station ${ocppConnectionName} (disabled by enableGetChargingProfilesOnStartTransaction configuration)`,
        );
      }
    } else {
      this._logger.error(`RequestStartTransaction failed: ${JSON.stringify(message.payload)}`);
    }
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.RequestStopTransaction)
  protected async _handleRequestStopTransaction(
    message: IMessage<OCPP2_response_types.RequestStopTransactionResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('RequestStopTransactionResponse received:', message, props);
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.CancelReservation)
  protected async _handleCancelReservation(
    message: IMessage<OCPP2_response_types.CancelReservationResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('CancelReservationResponse received:', message, props);

    const request = await this._ocppMessageRepository.readOnlyOneByQuery(message.context.tenantId, {
      where: {
        tenantId: message.context.tenantId,
        ocppConnectionName: message.context.ocppConnectionName,
        correlationId: message.context.correlationId,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });
    if (request) {
      await this._reservationRepository.updateByKey(
        message.context.tenantId,
        {
          isActive: message.payload.status === CancelReservationStatusEnum.Rejected,
        },
        request.message[3].reservationId,
      );
    } else {
      this._logger.error(
        `Update reservation failed. ReservationId not found by CorrelationId ${message.context.correlationId}.`,
      );
    }
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.ReserveNow)
  protected async _handleReserveNow(
    message: IMessage<OCPP2_response_types.ReserveNowResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('ReserveNowResponse received:', message, props);

    const request = await this._ocppMessageRepository.readOnlyOneByQuery(message.context.tenantId, {
      where: {
        tenantId: message.context.tenantId,
        ocppConnectionName: message.context.ocppConnectionName,
        correlationId: message.context.correlationId,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });
    if (request) {
      const status = message.payload.status as ReserveNowStatusEnumType;
      await this._reservationRepository.updateByKey(
        message.context.tenantId,
        {
          reserveStatus: status,
          isActive: status === ReserveNowStatusEnum.Accepted,
        },
        request.message[3].id,
      );
    } else {
      this._logger.error(
        `Update reservation failed. ReservationId not found by CorrelationId ${message.context.correlationId}.`,
      );
    }
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.UnlockConnector)
  protected async _handleUnlockConnector(
    message: IMessage<OCPP2_response_types.UnlockConnectorResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('UnlockConnectorResponse received:', message, props);
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.ClearCache)
  protected async _handleClearCache(
    message: IMessage<OCPP2_response_types.ClearCacheResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('ClearCacheResponse received:', message, props);
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.SendLocalList)
  protected async _handleSendLocalList(
    message: IMessage<OCPP2_response_types.SendLocalListResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SendLocalListResponse received:', message, props);

    const ocppConnectionName = message.context.ocppConnectionName;

    const sendLocalListRequest =
      await this._localAuthListRepository.getSendLocalListRequestByStationIdAndCorrelationId(
        message.context.tenantId,
        ocppConnectionName,
        message.context.correlationId,
      );

    if (!sendLocalListRequest) {
      this._logger.error(
        `Unable to process SendLocalListResponse. SendLocalListRequest not found for StationId ${ocppConnectionName} by CorrelationId ${message.context.correlationId}.`,
      );
      return;
    }

    const sendLocalListResponse = message.payload;

    switch (sendLocalListResponse.status) {
      case SendLocalListStatusEnum.Accepted:
        await this._localAuthListRepository.createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
          message.context.tenantId,
          ocppConnectionName,
          sendLocalListRequest,
        );
        break;
      case SendLocalListStatusEnum.Failed:
        // TODO: Surface alert for upstream handling
        this._logger.error(
          `SendLocalListRequest failed for StationId ${ocppConnectionName}: ${message.context.correlationId}, ${JSON.stringify(sendLocalListRequest)}.`,
        );
        break;
      case SendLocalListStatusEnum.VersionMismatch: {
        this._logger.error(
          `SendLocalListRequest version mismatch for StationId ${ocppConnectionName}: ${message.context.correlationId}, ${JSON.stringify(sendLocalListRequest)}.`,
        );
        this._logger.error(
          `Sending GetLocalListVersionRequest for StationId ${ocppConnectionName} due to SendLocalListRequest version mismatch.`,
        );
        const messageConfirmation = await this.sendCall(
          ocppConnectionName,
          message.context.tenantId,
          OCPPVersion.OCPP2_1,
          OCPP_CallAction.GetLocalListVersion,
          {} as OCPP2_request_types.GetLocalListVersionRequest,
        );
        if (!messageConfirmation.success) {
          this._logger.error(
            `Unable to send GetLocalListVersionRequest for StationId ${ocppConnectionName} due to SendLocalListRequest version mismatch.`,
            messageConfirmation,
          );
        }
        break;
      }
      default:
        this._logger.error(`Unknown SendLocalListStatusEnumType: ${message.payload.status}.`);
        break;
    }
  }

  @AsHandler(OCPP_2_VER_LIST, OCPP_CallAction.GetLocalListVersion)
  protected async _handleGetLocalListVersion(
    message: IMessage<OCPP2_response_types.GetLocalListVersionResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('GetLocalListVersionResponse received:', message, props);

    await this._localAuthListRepository.validateOrReplaceLocalListVersionForStation(
      message.context.tenantId,
      message.payload.versionNumber,
      message.context.ocppConnectionName,
    );
  }

  /**
   * C25: Handle NotifyWebPaymentStartedResponse from CS.
   *
   * CSMS sends NotifyWebPaymentStartedRequest to CS to lock the EVSE during the
   * web payment process (C25.FR.21). This handler processes the CS acknowledgment.
   */
  @AsHandler([OCPPVersion.OCPP2_1], OCPP_CallAction.NotifyWebPaymentStarted)
  protected async _handleNotifyWebPaymentStarted(
    message: IMessage<OCPP2_1.NotifyWebPaymentStartedResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('NotifyWebPaymentStartedResponse received:', message, props);
    this._logger.info(
      `NotifyWebPaymentStarted acknowledged by station ${message.context.ocppConnectionName} ` +
        `(correlationId=${message.context.correlationId})`,
    );
  }

  /**
   * Handle OCPP 1.6 responses
   */

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.RemoteStopTransaction)
  protected async _handleOcpp16RemoteStopTransaction(
    message: IMessage<OCPP1_6.RemoteStopTransactionResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('RemoteStopTransactionResponse received:', message, props);
  }

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.Authorize)
  protected async _handleOCPP16Authorize(
    message: IMessage<OCPP1_6.AuthorizeRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('OCPP 16 Authorize received: ', message, props);
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
        await this.sendCallResultWithMessage(message, response);
        this._logger.debug('Authorize response sent:', response);
        return;
      }
      // If we find more than one token for an idTag it's too opinionated on how to define which one is valid.
      // For now, we error out, and implementers should change this according to their needs.
      if (authorizations.length > 1) {
        this._logger.error(`Too many authorizations found for idToken: ${request.idTag}`);
        response.idTagInfo.status = OCPP1_6.AuthorizeResponseStatus.Invalid;
        await this.sendCallResultWithMessage(message, response);
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

    await this.sendCallResultWithMessage(message, response).then((messageConfirmation) => {
      this._logger.debug('Authorize response sent:', messageConfirmation);
    });
    return;
  }

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.RemoteStartTransaction)
  protected async _handleRemoteStartTransaction(
    message: IMessage<OCPP1_6.RemoteStartTransactionResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('RemoteStartTransactionResponse received:', message, props);

    const tenantId = message.context.tenantId;
    const ocppConnectionName: string = message.context.ocppConnectionName;

    if (message.payload.status === OCPP1_6.RemoteStartTransactionResponseStatus.Accepted) {
      const originalMessage = await this._ocppMessageRepository.readOnlyOneByQuery(tenantId, {
        where: {
          tenantId: tenantId,
          ocppConnectionName: ocppConnectionName,
          correlationId: message.context.correlationId,
          origin: MessageOrigin.ChargingStationManagementSystem,
        },
      });

      if (originalMessage) {
        const originalRequest = originalMessage.message[3] as OCPP1_6.RemoteStartTransactionRequest;

        if (originalRequest.chargingProfile) {
          const mapped = OCPP1_6_Mapper.ChargingProfileMapper.fromRemoteStartChargingProfile(
            originalRequest.chargingProfile,
          );

          await this._chargingProfileRepository.createOrUpdateChargingProfile(
            tenantId,
            mapped,
            ocppConnectionName,
            originalRequest.connectorId ?? null,
            ChargingLimitSourceEnum.CSO,
            true,
          );
        }
      } else {
        this._logger.error(
          `OCPP 1.6 RemoteStartTransaction accepted but original request not found by CorrelationId ${message.context.correlationId}.`,
        );
      }
    } else {
      this._logger.error(
        `OCPP 1.6 RemoteStartTransaction rejected: ${JSON.stringify(message.payload)}`,
      );
    }
  }

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.ClearCache)
  protected async _handleOcpp16ClearCache(
    message: IMessage<OCPP1_6.ClearCacheResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('ClearCacheResponse received:', message, props);
  }

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.SendLocalList)
  protected async _handleOcpp16SendLocalList(
    message: IMessage<OCPP1_6.SendLocalListResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('OCPP 1.6 SendLocalListResponse received:', message, props);

    const stationId = message.context.ocppConnectionName;

    const sendLocalListRequest =
      await this._localAuthListRepository.getSendLocalListRequestByStationIdAndCorrelationId(
        message.context.tenantId,
        stationId,
        message.context.correlationId,
      );

    if (!sendLocalListRequest) {
      this._logger.error(
        `Unable to process OCPP 1.6 SendLocalListResponse. SendLocalListRequest not found for StationId ${stationId} by CorrelationId ${message.context.correlationId}.`,
      );
      return;
    }

    switch (message.payload.status) {
      case OCPP1_6.SendLocalListResponseStatus.Accepted:
        await this._localAuthListRepository.createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
          message.context.tenantId,
          stationId,
          sendLocalListRequest,
        );
        break;
      case OCPP1_6.SendLocalListResponseStatus.Failed:
        this._logger.error(
          `OCPP 1.6 SendLocalListRequest failed for StationId ${stationId}: ${message.context.correlationId}, ${JSON.stringify(sendLocalListRequest)}.`,
        );
        break;
      case OCPP1_6.SendLocalListResponseStatus.VersionMismatch: {
        this._logger.error(
          `OCPP 1.6 SendLocalListRequest version mismatch for StationId ${stationId}; firing GetLocalListVersion to resync.`,
        );
        const messageConfirmation = await this.sendCall(
          stationId,
          message.context.tenantId,
          OCPPVersion.OCPP1_6,
          OCPP_CallAction.GetLocalListVersion,
          {} as OCPP1_6.GetLocalListVersionRequest,
        );
        if (!messageConfirmation.success) {
          this._logger.error(
            `Unable to send OCPP 1.6 GetLocalListVersion for StationId ${stationId} after version mismatch.`,
            messageConfirmation,
          );
        }
        break;
      }
      case OCPP1_6.SendLocalListResponseStatus.NotSupported:
        this._logger.error(
          `OCPP 1.6 SendLocalListRequest reported NotSupported for StationId ${stationId}.`,
        );
        break;
      default:
        this._logger.error(
          `Unknown OCPP 1.6 SendLocalListResponseStatus: ${message.payload.status}.`,
        );
        break;
    }
  }

  @AsHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.GetLocalListVersion)
  protected async _handleOcpp16GetLocalListVersion(
    message: IMessage<OCPP1_6.GetLocalListVersionResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('OCPP 1.6 GetLocalListVersionResponse received:', message, props);

    await this._localAuthListRepository.validateOrReplaceLocalListVersionForStation(
      message.context.tenantId,
      message.payload.listVersion,
      message.context.ocppConnectionName,
    );
  }
}

export default EVDriverModule;
