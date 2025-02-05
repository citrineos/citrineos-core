// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  AsHandler,
  CallAction,
  ChargingStationSequenceType,
  EventGroup,
  HandlerProperties,
  ICache,
  IMessage,
  IMessageHandler,
  IMessageSender,
  OCPP1_6,
  OCPP1_6_CallAction,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OCPPVersion,
  SystemConfig,
} from '@citrineos/base';
import {
  CallMessage,
  IAuthorizationRepository,
  ICallMessageRepository,
  IChargingProfileRepository,
  IDeviceModelRepository,
  ILocalAuthListRepository,
  IReservationRepository,
  ITariffRepository,
  ITransactionEventRepository,
  sequelize,
  SequelizeChargingStationSequenceRepository,
  Tariff,
  VariableAttribute,
} from '@citrineos/data';
import {
  CertificateAuthorityService,
  IAuthorizer,
  IdGenerator,
  RabbitMqReceiver,
  RabbitMqSender,
} from '@citrineos/util';
import { ILogObj, Logger } from 'tslog';
import { LocalAuthListService } from './LocalAuthListService';

/**
 * Component that handles provisioning related messages.
 */
export class EVDriverModule extends AbstractModule {
  /**
   * Fields
   */

  _requests: CallAction[] = [
    OCPP2_0_1_CallAction.Authorize,
    OCPP2_0_1_CallAction.ReservationStatusUpdate,
  ];
  _responses: CallAction[] = [
    OCPP2_0_1_CallAction.CancelReservation,
    OCPP2_0_1_CallAction.ClearCache,
    OCPP2_0_1_CallAction.GetLocalListVersion,
    OCPP2_0_1_CallAction.RequestStartTransaction,
    OCPP2_0_1_CallAction.RequestStopTransaction,
    OCPP2_0_1_CallAction.ReserveNow,
    OCPP2_0_1_CallAction.SendLocalList,
    OCPP2_0_1_CallAction.UnlockConnector,
    OCPP1_6_CallAction.RemoteStopTransaction,
  ];

  protected _authorizeRepository: IAuthorizationRepository;
  protected _localAuthListRepository: ILocalAuthListRepository;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _tariffRepository: ITariffRepository;
  protected _transactionEventRepository: ITransactionEventRepository;
  protected _chargingProfileRepository: IChargingProfileRepository;
  protected _reservationRepository: IReservationRepository;
  protected _callMessageRepository: ICallMessageRepository;

  private _certificateAuthorityService: CertificateAuthorityService;
  private _localAuthListService: LocalAuthListService;
  private _authorizers: IAuthorizer[];
  private _idGenerator: IdGenerator;

  /**
   * This is the constructor function that initializes the {@link EVDriverModule}.
   *
   * @param {SystemConfig} config - The `config` contains configuration settings for the module.
   *
   * @param {ICache} [cache] - The cache instance which is shared among the modules & Central System to pass information such as blacklisted actions or boot status.
   *
   * @param {IMessageSender} [sender] - The `sender` parameter is an optional parameter that represents an instance of the {@link IMessageSender} interface.
   * It is used to send messages from the central system to external systems or devices. If no `sender` is provided, a default {@link RabbitMqSender} instance is created and used.
   *
   * @param {IMessageHandler} [handler] - The `handler` parameter is an optional parameter that represents an instance of the {@link IMessageHandler} interface.
   * It is used to handle incoming messages and dispatch them to the appropriate methods or functions. If no `handler` is provided, a default {@link RabbitMqReceiver} instance is created and used.
   *
   * @param {Logger<ILogObj>} [logger] - The `logger` parameter is an optional parameter that represents an instance of {@link Logger<ILogObj>}.
   * It is used to propagate system wide logger settings and will serve as the parent logger for any sub-component logging. If no `logger` is provided, a default {@link Logger<ILogObj>} instance is created and used.
   *
   * @param {IAuthorizationRepository} [authorizeRepository] - An optional parameter of type {@link IAuthorizationRepository} which represents a repository for accessing and manipulating Authorization data.
   * If no `authorizeRepository` is provided, a default {@link sequelize:AuthorizationRepository} instance is created and used.
   *
   * @param {ILocalAuthListRepository} [localAuthListRepository] - An optional parameter of type {@link ILocalAuthListRepository} which represents a repository for accessing and manipulating Local Authorization List data.
   * If no `localAuthListRepository` is provided, a default {@link sequelize:localAuthListRepository} instance is created and used.
   *
   * @param {IDeviceModelRepository} [deviceModelRepository] - An optional parameter of type {@link IDeviceModelRepository} which represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize:deviceModelRepository} instance is
   * created and used.
   *
   * @param {ITariffRepository} [tariffRepository] - An optional parameter of type {@link ITariffRepository} which
   * represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize:tariffRepository} instance is
   * created and used.
   *
   * @param {ITransactionEventRepository} [transactionEventRepository] - An optional parameter of type {@link ITransactionEventRepository}
   * which represents a repository for accessing and manipulating transaction data.
   * If no `transactionEventRepository` is provided, a default {@link sequelize:transactionEventRepository} instance is
   * created and used.
   *
   * @param {IChargingProfileRepository} [chargingProfileRepository] - An optional parameter of type {@link IChargingProfileRepository}
   * which represents a repository for accessing and manipulating charging profile data.
   * If no `chargingProfileRepository` is provided, a default {@link sequelize:chargingProfileRepository} instance is created and used.
   *
   * @param {IReservationRepository} [reservationRepository] - An optional parameter of type {@link IReservationRepository}
   * which represents a repository for accessing and manipulating reservation data.
   * If no `reservationRepository` is provided, a default {@link sequelize:reservationRepository} instance is created and used.
   *
   * @param {ICallMessageRepository} [callMessageRepository]  - An optional parameter of type {@link ICallMessageRepository}
   * which represents a repository for accessing and manipulating callMessage data.
   * If no `callMessageRepository` is provided, a default {@link sequelize:callMessageRepository} instance is created and used.
   *
   * @param {CertificateAuthorityService} [certificateAuthorityService] - An optional parameter of
   * type {@link CertificateAuthorityService} which handles certificate authority operations.
   *
   * @param {IAuthorizer[]} [authorizers] - An optional parameter of type {@link IAuthorizer[]} which represents
   * a list of authorizers that can be used to authorize requests.
   */
  constructor(
    config: SystemConfig,
    cache: ICache,
    sender?: IMessageSender,
    handler?: IMessageHandler,
    logger?: Logger<ILogObj>,
    authorizeRepository?: IAuthorizationRepository,
    localAuthListRepository?: ILocalAuthListRepository,
    deviceModelRepository?: IDeviceModelRepository,
    tariffRepository?: ITariffRepository,
    transactionEventRepository?: ITransactionEventRepository,
    chargingProfileRepository?: IChargingProfileRepository,
    reservationRepository?: IReservationRepository,
    callMessageRepository?: ICallMessageRepository,
    certificateAuthorityService?: CertificateAuthorityService,
    authorizers?: IAuthorizer[],
    idGenerator?: IdGenerator,
  ) {
    super(
      config,
      cache,
      handler || new RabbitMqReceiver(config, logger),
      sender || new RabbitMqSender(config, logger),
      EventGroup.EVDriver,
      logger,
    );

    this._authorizeRepository =
      authorizeRepository ||
      new sequelize.SequelizeAuthorizationRepository(config, logger);
    this._localAuthListRepository =
      localAuthListRepository ||
      new sequelize.SequelizeLocalAuthListRepository(config, logger);
    this._deviceModelRepository =
      deviceModelRepository ||
      new sequelize.SequelizeDeviceModelRepository(config, logger);
    this._tariffRepository =
      tariffRepository ||
      new sequelize.SequelizeTariffRepository(config, logger);
    this._transactionEventRepository =
      transactionEventRepository ||
      new sequelize.SequelizeTransactionEventRepository(config, logger);
    this._chargingProfileRepository =
      chargingProfileRepository ||
      new sequelize.SequelizeChargingProfileRepository(config, logger);
    this._reservationRepository =
      reservationRepository ||
      new sequelize.SequelizeReservationRepository(config, logger);
    this._callMessageRepository =
      callMessageRepository ||
      new sequelize.SequelizeCallMessageRepository(config, logger);

    this._certificateAuthorityService =
      certificateAuthorityService ||
      new CertificateAuthorityService(config, logger);

    this._localAuthListService = new LocalAuthListService(
      this._localAuthListRepository,
      this._deviceModelRepository,
    );

    this._authorizers = authorizers || [];

    this._idGenerator =
      idGenerator ||
      new IdGenerator(
        new SequelizeChargingStationSequenceRepository(config, this._logger),
      );
  }

  get authorizeRepository(): IAuthorizationRepository {
    return this._authorizeRepository;
  }

  get localAuthListRepository(): ILocalAuthListRepository {
    return this._localAuthListRepository;
  }

  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }

  get transactionEventRepository(): ITransactionEventRepository {
    return this._transactionEventRepository;
  }

  get chargingProfileRepository(): IChargingProfileRepository {
    return this._chargingProfileRepository;
  }

  get reservationRepository(): IReservationRepository {
    return this._reservationRepository;
  }

  get callMessageRepository(): ICallMessageRepository {
    return this._callMessageRepository;
  }

  get localAuthListService(): LocalAuthListService {
    return this._localAuthListService;
  }

  /**
   * Handle OCPP 2.0.1 requests
   */

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.Authorize)
  protected async _handleAuthorize(
    message: IMessage<OCPP2_0_1.AuthorizeRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Authorize received:', message, props);
    const request: OCPP2_0_1.AuthorizeRequest = message.payload;
    const context = message.context;
    const response: OCPP2_0_1.AuthorizeResponse = {
      idTokenInfo: {
        status: OCPP2_0_1.AuthorizationStatusEnumType.Unknown,
        // TODO determine how/if to set personalMessage
      },
    };

    if (message.payload.idToken.type === OCPP2_0_1.IdTokenEnumType.NoAuthorization) {
      response.idTokenInfo.status = OCPP2_0_1.AuthorizationStatusEnumType.Accepted;
      await this.sendCallResultWithMessage(message, response);
      return;
    }

    // Validate Contract Certificates based on OCPP 2.0.1 Part 2 C07
    if (request.iso15118CertificateHashData || request.certificate) {
      // TODO - implement validation using cached OCSP data described in C07.FR.05
      if (
        request.iso15118CertificateHashData &&
        request.iso15118CertificateHashData.length > 0
      ) {
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
          await this._certificateAuthorityService.validateCertificateChainPem(
            request.certificate,
          );
      }
      if (
        response.certificateStatus !==
        OCPP2_0_1.AuthorizeCertificateStatusEnumType.Accepted
      ) {
        const messageConfirmation = await this.sendCallResultWithMessage(
          message,
          response,
        );
        this._logger.debug('Authorize response sent:', messageConfirmation);
        return;
      }
    }

    await this._authorizeRepository
      .readOnlyOneByQuerystring({ ...request.idToken })
      .then(async (authorization) => {
        if (authorization) {
          if (authorization.idTokenInfo) {
            // Extract DTO fields from sequelize Model<any, any> objects
            const idTokenInfo: OCPP2_0_1.IdTokenInfoType = {
              status: authorization.idTokenInfo.status,
              cacheExpiryDateTime:
                authorization.idTokenInfo.cacheExpiryDateTime,
              chargingPriority: authorization.idTokenInfo.chargingPriority,
              language1: authorization.idTokenInfo.language1,
              evseId: authorization.idTokenInfo.evseId,
              groupIdToken: authorization.idTokenInfo.groupIdToken
                ? {
                  additionalInfo:
                    authorization.idTokenInfo.groupIdToken.additionalInfo &&
                      authorization.idTokenInfo.groupIdToken.additionalInfo
                        .length > 0
                      ? (authorization.idTokenInfo.groupIdToken.additionalInfo.map(
                        (additionalInfo) => ({
                          additionalIdToken:
                            additionalInfo.additionalIdToken,
                          type: additionalInfo.type,
                        }),
                      ) as [OCPP2_0_1.AdditionalInfoType, ...OCPP2_0_1.AdditionalInfoType[]])
                      : undefined,
                  idToken: authorization.idTokenInfo.groupIdToken.idToken,
                  type: authorization.idTokenInfo.groupIdToken.type,
                }
                : undefined,
              language2: authorization.idTokenInfo.language2,
              personalMessage: authorization.idTokenInfo.personalMessage,
            };

            if (idTokenInfo.status === OCPP2_0_1.AuthorizationStatusEnumType.Accepted) {
              if (
                idTokenInfo.cacheExpiryDateTime &&
                new Date() > new Date(idTokenInfo.cacheExpiryDateTime)
              ) {
                response.idTokenInfo = {
                  status: OCPP2_0_1.AuthorizationStatusEnumType.Invalid,
                  groupIdToken: idTokenInfo.groupIdToken,
                  // TODO determine how/if to set personalMessage
                };
              } else {
                // If charging station does not have values and evses associated with the component/variable pairs below,
                // this logic will break. CSMS's aiming to use the allowedConnectorTypes or disallowedEvseIdPrefixes
                // Authorization restrictions MUST provide these variable attributes as defined in Physical Component
                // list of Part 2 - Appendices of OCPP 2.0.1
                let evseIds: Set<number> | undefined;
                if (authorization.allowedConnectorTypes) {
                  evseIds = new Set();
                  const connectorTypes: VariableAttribute[] =
                    await this._deviceModelRepository.readAllByQuerystring({
                      stationId: message.context.stationId,
                      component_name: 'Connector',
                      variable_name: 'ConnectorType',
                      type: OCPP2_0_1.AttributeEnumType.Actual,
                    });
                  for (const connectorType of connectorTypes) {
                    if (
                      authorization.allowedConnectorTypes.indexOf(
                        connectorType.value as string,
                      ) > 0
                    ) {
                      evseIds.add(connectorType.evse?.id as number);
                    }
                  }
                }
                if (evseIds && evseIds.size === 0) {
                  response.idTokenInfo = {
                    status: OCPP2_0_1.AuthorizationStatusEnumType.NotAllowedTypeEVSE,
                    groupIdToken: idTokenInfo.groupIdToken,
                    // TODO determine how/if to set personalMessage
                  };
                } else {
                  // EVSEID prefixes here follow the ISO 15118/IEC 63119-2 format, unlike the evseId list on the
                  // IdTokenInfo object which refers to the serial evse ids defined within OCPP 2.0.1's 3-tier model
                  // Thus, the EvseId variable of the EVSE component defined in Part 2 - Appendices of OCPP 2.0.1
                  // Needs to be looked up to perform the match
                  if (authorization.disallowedEvseIdPrefixes) {
                    evseIds = evseIds ? evseIds : new Set();
                    const evseIdAttributes: VariableAttribute[] =
                      await this._deviceModelRepository.readAllByQuerystring({
                        stationId: message.context.stationId,
                        component_name: 'EVSE',
                        variable_name: 'EvseId',
                        type: OCPP2_0_1.AttributeEnumType.Actual,
                      });
                    for (const evseIdAttribute of evseIdAttributes) {
                      const evseIdAllowed: boolean =
                        authorization.disallowedEvseIdPrefixes.some(
                          (disallowedEvseId) =>
                            (evseIdAttribute.value as string).startsWith(
                              disallowedEvseId,
                            ),
                        );
                      // If evseId allowed and evseIds were not already filtered by connector type, add to set
                      // If evseId not allowed and evseIds were already filtered by connector type, remove from set
                      if (
                        evseIdAllowed &&
                        !authorization.allowedConnectorTypes
                      ) {
                        evseIds.add(evseIdAttribute.evse?.id as number);
                      } else if (
                        !evseIdAllowed &&
                        authorization.allowedConnectorTypes
                      ) {
                        evseIds.delete(evseIdAttribute.evse?.id as number);
                      }
                    }
                  }
                  if (evseIds && evseIds.size === 0) {
                    response.idTokenInfo = {
                      status: OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisLocation,
                      groupIdToken: idTokenInfo.groupIdToken,
                      // TODO determine how/if to set personalMessage
                    };
                  } else {
                    // TODO: Determine how to check for NotAtThisTime
                    response.idTokenInfo = idTokenInfo;
                    const evseId: number[] = [
                      ...(evseIds ? evseIds.values() : []),
                    ];
                    if (evseId.length > 0) {
                      response.idTokenInfo.evseId = [
                        evseId.pop() as number,
                        ...evseId,
                      ];
                    }
                  }
                }
              }

              for (const authorizer of this._authorizers) {
                if (
                  response.idTokenInfo.status !==
                  OCPP2_0_1.AuthorizationStatusEnumType.Accepted
                ) {
                  break;
                }
                const result: Partial<OCPP2_0_1.IdTokenType> = await authorizer.authorize(
                  authorization,
                  context,
                );
                Object.assign(response.idTokenInfo, result);
              }
            } else {
              // IdTokenInfo.status is one of Blocked, Expired, Invalid, NoCredit
              // N.B. Other statuses should not be allowed to be stored.
              response.idTokenInfo = idTokenInfo;
            }
          } else {
            // Assumed to always be valid without IdTokenInfo
            response.idTokenInfo = {
              status: OCPP2_0_1.AuthorizationStatusEnumType.Accepted,
              // TODO determine how/if to set personalMessage
            };
          }
        }

        if (
          response.idTokenInfo.status === OCPP2_0_1.AuthorizationStatusEnumType.Accepted
        ) {
          const tariffAvailable: VariableAttribute[] =
            await this._deviceModelRepository.readAllByQuerystring({
              stationId: message.context.stationId,
              component_name: 'TariffCostCtrlr',
              variable_name: 'Available',
              variable_instance: 'Tariff',
              type: OCPP2_0_1.AttributeEnumType.Actual,
            });

          const displayMessageAvailable: VariableAttribute[] =
            await this._deviceModelRepository.readAllByQuerystring({
              stationId: message.context.stationId,
              component_name: 'DisplayMessageCtrlr',
              variable_name: 'Available',
              type: OCPP2_0_1.AttributeEnumType.Actual,
            });

          // only send the tariff information if the Charging Station supports the tariff or DisplayMessage functionality
          if (
            (tariffAvailable.length > 0 && Boolean(tariffAvailable[0].value)) ||
            (displayMessageAvailable.length > 0 &&
              Boolean(displayMessageAvailable[0].value))
          ) {
            // TODO: refactor the workaround below after tariff implementation is finalized.
            const tariff: Tariff | undefined =
              await this._tariffRepository.findByStationId(
                message.context.stationId,
              );
            if (tariff) {
              if (!response.idTokenInfo.personalMessage) {
                response.idTokenInfo.personalMessage = {
                  format: OCPP2_0_1.MessageFormatEnumType.ASCII,
                } as OCPP2_0_1.MessageContentType;
              }
              response.idTokenInfo.personalMessage.content = `${tariff.pricePerKwh}/kWh`;
            }
          }
        }
        return this.sendCallResultWithMessage(message, response);
      })
      .then((messageConfirmation) => {
        this._logger.debug('Authorize response sent:', messageConfirmation);
      });
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.ReservationStatusUpdate)
  protected async _handleReservationStatusUpdate(
    message: IMessage<OCPP2_0_1.ReservationStatusUpdateRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      'ReservationStatusUpdateRequest received:',
      message,
      props,
    );

    try {
      const status = message.payload
        .reservationUpdateStatus as OCPP2_0_1.ReservationUpdateStatusEnumType;
      const reservation = await this._reservationRepository.readOnlyOneByQuery({
        where: {
          stationId: message.context.stationId,
          id: message.payload.reservationId,
        },
      });
      if (reservation) {
        if (
          status === OCPP2_0_1.ReservationUpdateStatusEnumType.Expired ||
          status === OCPP2_0_1.ReservationUpdateStatusEnumType.Removed
        ) {
          await this._reservationRepository.updateByKey(
            {
              isActive: false,
            },
            reservation.databaseId.toString(),
          );
        }
      } else {
        throw new Error(
          `Reservation ${message.payload.reservationId} not found`,
        );
      }
    } catch (error) {
      this._logger.error('Error reading reservation:', error);
    }

    // Create response
    const response: OCPP2_0_1.ReservationStatusUpdateResponse = {};

    const messageConfirmation = await this.sendCallResultWithMessage(
      message,
      response,
    );
    this._logger.debug(
      'ReservationStatusUpdate response sent: ',
      messageConfirmation,
    );
  }

  /**
   * Handle OCPP 2.0.1 responses
   */

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.RequestStartTransaction)
  protected async _handleRequestStartTransaction(
    message: IMessage<OCPP2_0_1.RequestStartTransactionResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      'RequestStartTransactionResponse received:',
      message,
      props,
    );
    if (message.payload.status === OCPP2_0_1.RequestStartStopStatusEnumType.Accepted) {
      // Start transaction with charging profile succeeds,
      // we need to update db entity with the latest data from charger
      const stationId: string = message.context.stationId;
      // 1. Clear all existing profiles: find existing active profiles and set them to isActive false
      await this._chargingProfileRepository.updateAllByQuery(
        {
          isActive: false,
        },
        {
          where: {
            stationId: stationId,
            isActive: true,
            chargingLimitSource: OCPP2_0_1.ChargingLimitSourceEnumType.CSO,
            chargingProfilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile,
          },
          returning: false,
        },
      );
      // 2. Request charging profiles to get the latest data
      await this.sendCall(
        stationId,
        message.context.tenantId,
        OCPPVersion.OCPP2_0_1,
        OCPP2_0_1_CallAction.GetChargingProfiles,
        {
          requestId: await this._idGenerator.generateRequestId(
            message.context.stationId,
            ChargingStationSequenceType.getChargingProfiles,
          ),
          chargingProfile: {
            chargingProfilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile,
            chargingLimitSource: [OCPP2_0_1.ChargingLimitSourceEnumType.CSO],
          } as OCPP2_0_1.ChargingProfileCriterionType,
        } as OCPP2_0_1.GetChargingProfilesRequest,
      );
    } else {
      this._logger.error(
        `RequestStartTransaction failed: ${JSON.stringify(message.payload)}`,
      );
    }
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.RequestStopTransaction)
  protected async _handleRequestStopTransaction(
    message: IMessage<OCPP2_0_1.RequestStopTransactionResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      'RequestStopTransactionResponse received:',
      message,
      props,
    );
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.CancelReservation)
  protected async _handleCancelReservation(
    message: IMessage<OCPP2_0_1.CancelReservationResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('CancelReservationResponse received:', message, props);

    const reservationId = await this._findReservationByCorrelationId(
      message.context.correlationId,
    );
    if (reservationId) {
      await this._reservationRepository.updateByKey(
        {
          isActive:
            message.payload.status === OCPP2_0_1.CancelReservationStatusEnumType.Rejected,
        },
        reservationId.toString(),
      );
    } else {
      this._logger.error(
        `Update reservation failed. ReservationId not found by CorrelationId ${message.context.correlationId}.`,
      );
    }
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.ReserveNow)
  protected async _handleReserveNow(
    message: IMessage<OCPP2_0_1.ReserveNowResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('ReserveNowResponse received:', message, props);

    const reservationId = await this._findReservationByCorrelationId(
      message.context.correlationId,
    );
    if (reservationId) {
      const status = message.payload.status as OCPP2_0_1.ReserveNowStatusEnumType;
      await this._reservationRepository.updateByKey(
        {
          reserveStatus: status,
          isActive: status === OCPP2_0_1.ReserveNowStatusEnumType.Accepted,
        },
        reservationId.toString(),
      );
    } else {
      this._logger.error(
        `Update reservation failed. ReservationId not found by CorrelationId ${message.context.correlationId}.`,
      );
    }
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.UnlockConnector)
  protected async _handleUnlockConnector(
    message: IMessage<OCPP2_0_1.UnlockConnectorResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('UnlockConnectorResponse received:', message, props);
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.ClearCache)
  protected async _handleClearCache(
    message: IMessage<OCPP2_0_1.ClearCacheResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('ClearCacheResponse received:', message, props);
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.SendLocalList)
  protected async _handleSendLocalList(
    message: IMessage<OCPP2_0_1.SendLocalListResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SendLocalListResponse received:', message, props);

    const stationId = message.context.stationId;

    const sendLocalListRequest =
      await this._localAuthListRepository.getSendLocalListRequestByStationIdAndCorrelationId(
        stationId,
        message.context.correlationId,
      );

    if (!sendLocalListRequest) {
      this._logger.error(
        `Unable to process SendLocalListResponse. SendLocalListRequest not found for StationId ${stationId} by CorrelationId ${message.context.correlationId}.`,
      );
      return;
    }

    const sendLocalListResponse = message.payload;

    switch (sendLocalListResponse.status) {
      case OCPP2_0_1.SendLocalListStatusEnumType.Accepted:
        await this._localAuthListRepository.createOrUpdateLocalListVersionFromStationIdAndSendLocalList(
          stationId,
          sendLocalListRequest,
        );
        break;
      case OCPP2_0_1.SendLocalListStatusEnumType.Failed:
        // TODO: Surface alert for upstream handling
        this._logger.error(
          `SendLocalListRequest failed for StationId ${stationId}: ${message.context.correlationId}, ${JSON.stringify(sendLocalListRequest)}.`,
        );
        break;
      case OCPP2_0_1.SendLocalListStatusEnumType.VersionMismatch: {
        this._logger.error(
          `SendLocalListRequest version mismatch for StationId ${stationId}: ${message.context.correlationId}, ${JSON.stringify(sendLocalListRequest)}.`,
        );
        this._logger.error(
          `Sending GetLocalListVersionRequest for StationId ${stationId} due to SendLocalListRequest version mismatch.`,
        );
        const messageConfirmation = await this.sendCall(
          stationId,
          message.context.tenantId,
          OCPPVersion.OCPP2_0_1,
          OCPP2_0_1_CallAction.GetLocalListVersion,
          {} as OCPP2_0_1.GetLocalListVersionRequest,
        );
        if (!messageConfirmation.success) {
          this._logger.error(
            `Unable to send GetLocalListVersionRequest for StationId ${stationId} due to SendLocalListRequest version mismatch.`,
            messageConfirmation,
          );
        }
        break;
      }
      default:
        this._logger.error(
          `Unknown SendLocalListStatusEnumType: ${sendLocalListResponse.status}.`,
        );
        break;
    }
  }

  @AsHandler(OCPPVersion.OCPP2_0_1, OCPP2_0_1_CallAction.GetLocalListVersion)
  protected async _handleGetLocalListVersion(
    message: IMessage<OCPP2_0_1.GetLocalListVersionResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('GetLocalListVersionResponse received:', message, props);

    await this._localAuthListRepository.validateOrReplaceLocalListVersionForStation(
      message.payload.versionNumber,
      message.context.stationId,
    );
  }

  /**
   * Handle OCPP 1.6 responses
   */

  @AsHandler(OCPPVersion.OCPP1_6, OCPP1_6_CallAction.RemoteStopTransaction)
  protected async _handleOcpp16RemoteStopTransaction(
    message: IMessage<OCPP1_6.RemoteStopTransactionResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      'RequestStopTransactionResponse received:',
      message,
      props,
    );
    if (
      message.payload.status !==
      OCPP1_6.RemoteStopTransactionResponseStatus.Accepted
    ) {
      this._logger.error(
        `RemoteStopTransaction failed with status: ${message.payload.status}`,
      );
    }
  }

  private async _findReservationByCorrelationId(
    correlationId: string,
  ): Promise<number | undefined> {
    try {
      const callMessage: CallMessage | undefined =
        await this._callMessageRepository.readOnlyOneByQuery({
          where: {
            correlationId,
          },
        });
      if (callMessage && callMessage.reservationId) {
        return callMessage.reservationId;
      }
    } catch (e) {
      this._logger.error(e);
    }

    return undefined;
  }
}
