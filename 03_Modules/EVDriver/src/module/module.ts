// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  AdditionalInfoType,
  AsHandler,
  AttributeEnumType,
  AuthorizationStatusEnumType,
  AuthorizeCertificateStatusEnumType,
  AuthorizeRequest,
  AuthorizeResponse,
  CallAction,
  CancelReservationResponse,
  CancelReservationStatusEnumType,
  ChargingLimitSourceEnumType,
  ChargingProfileCriterionType,
  ChargingProfilePurposeEnumType,
  ClearCacheResponse,
  EventGroup,
  GetChargingProfilesRequest,
  GetLocalListVersionResponse,
  HandlerProperties,
  ICache,
  IdTokenEnumType,
  IdTokenInfoType,
  IdTokenType,
  IMessage,
  IMessageHandler,
  IMessageSender,
  MessageContentType,
  MessageFormatEnumType,
  RequestStartStopStatusEnumType,
  RequestStartTransactionResponse,
  RequestStopTransactionResponse,
  ReservationStatusUpdateRequest,
  ReservationStatusUpdateResponse,
  ReservationUpdateStatusEnumType,
  ReserveNowResponse,
  ReserveNowStatusEnumType,
  SendLocalListResponse,
  SendLocalListStatusEnumType,
  SystemConfig,
  UnlockConnectorResponse,
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
  Tariff,
  VariableAttribute,
} from '@citrineos/data';
import {
  CertificateAuthorityService,
  generateRequestId,
  IAuthorizer,
  RabbitMqReceiver,
  RabbitMqSender,
  Timer,
} from '@citrineos/util';
import deasyncPromise from 'deasync-promise';
import { ILogObj, Logger } from 'tslog';

/**
 * Component that handles provisioning related messages.
 */
export class EVDriverModule extends AbstractModule {
  /**
   * Fields
   */
  protected _requests: CallAction[] = [
    CallAction.Authorize,
    CallAction.ReservationStatusUpdate,
  ];
  protected _responses: CallAction[] = [
    CallAction.CancelReservation,
    CallAction.ClearCache,
    CallAction.GetLocalListVersion,
    CallAction.RequestStartTransaction,
    CallAction.RequestStopTransaction,
    CallAction.ReserveNow,
    CallAction.SendLocalList,
    CallAction.UnlockConnector,
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
  private _authorizers: IAuthorizer[];

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
  ) {
    super(
      config,
      cache,
      handler || new RabbitMqReceiver(config, logger),
      sender || new RabbitMqSender(config, logger),
      EventGroup.EVDriver,
      logger,
    );

    const timer = new Timer();
    this._logger.info('Initializing...');

    if (!deasyncPromise(this._initHandler(this._requests, this._responses))) {
      throw new Error(
        'Could not initialize module due to failure in handler initialization.',
      );
    }

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

    this._authorizers = authorizers || [];

    this._logger.info(`Initialized in ${timer.end()}ms...`);
  }

  get authorizeRepository(): IAuthorizationRepository {
    return this._authorizeRepository;
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

  /**
   * Handle requests
   */

  @AsHandler(CallAction.Authorize)
  protected async _handleAuthorize(
    message: IMessage<AuthorizeRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Authorize received:', message, props);
    const request: AuthorizeRequest = message.payload;
    const context = message.context;
    const response: AuthorizeResponse = {
      idTokenInfo: {
        status: AuthorizationStatusEnumType.Unknown,
        // TODO determine how/if to set personalMessage
      },
    };

    if (message.payload.idToken.type === IdTokenEnumType.NoAuthorization) {
      response.idTokenInfo.status = AuthorizationStatusEnumType.Accepted;
      this.sendCallResultWithMessage(message, response);
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
        AuthorizeCertificateStatusEnumType.Accepted
      ) {
        this.sendCallResultWithMessage(message, response).then(
          (messageConfirmation) => {
            this._logger.debug('Authorize response sent:', messageConfirmation);
          },
        );
        return;
      }
    }

    await this._authorizeRepository
      .readOnlyOneByQuerystring({ ...request.idToken })
      .then(async (authorization) => {
        if (authorization) {
          if (authorization.idTokenInfo) {
            // Extract DTO fields from sequelize Model<any, any> objects
            const idTokenInfo: IdTokenInfoType = {
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
                          ) as [AdditionalInfoType, ...AdditionalInfoType[]])
                        : undefined,
                    idToken: authorization.idTokenInfo.groupIdToken.idToken,
                    type: authorization.idTokenInfo.groupIdToken.type,
                  }
                : undefined,
              language2: authorization.idTokenInfo.language2,
              personalMessage: authorization.idTokenInfo.personalMessage,
            };

            if (idTokenInfo.status === AuthorizationStatusEnumType.Accepted) {
              if (
                idTokenInfo.cacheExpiryDateTime &&
                new Date() > new Date(idTokenInfo.cacheExpiryDateTime)
              ) {
                response.idTokenInfo = {
                  status: AuthorizationStatusEnumType.Invalid,
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
                      type: AttributeEnumType.Actual,
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
                    status: AuthorizationStatusEnumType.NotAllowedTypeEVSE,
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
                        type: AttributeEnumType.Actual,
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
                      status: AuthorizationStatusEnumType.NotAtThisLocation,
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
                  AuthorizationStatusEnumType.Accepted
                ) {
                  break;
                }
                const result: Partial<IdTokenType> = await authorizer.authorize(
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
              status: AuthorizationStatusEnumType.Accepted,
              // TODO determine how/if to set personalMessage
            };
          }
        }

        if (
          response.idTokenInfo.status === AuthorizationStatusEnumType.Accepted
        ) {
          const tariffAvailable: VariableAttribute[] =
            await this._deviceModelRepository.readAllByQuerystring({
              stationId: message.context.stationId,
              component_name: 'TariffCostCtrlr',
              variable_name: 'Available',
              variable_instance: 'Tariff',
              type: AttributeEnumType.Actual,
            });

          const displayMessageAvailable: VariableAttribute[] =
            await this._deviceModelRepository.readAllByQuerystring({
              stationId: message.context.stationId,
              component_name: 'DisplayMessageCtrlr',
              variable_name: 'Available',
              type: AttributeEnumType.Actual,
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
                  format: MessageFormatEnumType.ASCII,
                } as MessageContentType;
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

  @AsHandler(CallAction.ReservationStatusUpdate)
  protected async _handleReservationStatusUpdate(
    message: IMessage<ReservationStatusUpdateRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      'ReservationStatusUpdateRequest received:',
      message,
      props,
    );

    try {
      const status = message.payload
        .reservationUpdateStatus as ReservationUpdateStatusEnumType;
      const reservation = await this._reservationRepository.readOnlyOneByQuery({
        where: {
          stationId: message.context.stationId,
          id: message.payload.reservationId,
        },
      });
      if (reservation) {
        if (
          status === ReservationUpdateStatusEnumType.Expired ||
          status === ReservationUpdateStatusEnumType.Removed
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
    const response: ReservationStatusUpdateResponse = {};

    this.sendCallResultWithMessage(message, response).then(
      (messageConfirmation) =>
        this._logger.debug(
          'ReservationStatusUpdate response sent: ',
          messageConfirmation,
        ),
    );
  }

  /**
   * Handle responses
   */

  @AsHandler(CallAction.RequestStartTransaction)
  protected async _handleRequestStartTransaction(
    message: IMessage<RequestStartTransactionResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      'RequestStartTransactionResponse received:',
      message,
      props,
    );
    if (message.payload.status === RequestStartStopStatusEnumType.Accepted) {
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
            chargingLimitSource: ChargingLimitSourceEnumType.CSO,
            chargingProfilePurpose: ChargingProfilePurposeEnumType.TxProfile,
          },
          returning: false,
        },
      );
      // 2. Request charging profiles to get the latest data
      this.sendCall(
        stationId,
        message.context.tenantId,
        CallAction.GetChargingProfiles,
        {
          requestId: generateRequestId(),
          chargingProfile: {
            chargingProfilePurpose: ChargingProfilePurposeEnumType.TxProfile,
            chargingLimitSource: [ChargingLimitSourceEnumType.CSO],
          } as ChargingProfileCriterionType,
        } as GetChargingProfilesRequest,
      );
    } else {
      this._logger.error(
        `RequestStartTransaction failed: ${JSON.stringify(message.payload)}`,
      );
    }
  }

  @AsHandler(CallAction.RequestStopTransaction)
  protected async _handleRequestStopTransaction(
    message: IMessage<RequestStopTransactionResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      'RequestStopTransactionResponse received:',
      message,
      props,
    );
  }

  @AsHandler(CallAction.CancelReservation)
  protected async _handleCancelReservation(
    message: IMessage<CancelReservationResponse>,
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
            message.payload.status === CancelReservationStatusEnumType.Rejected,
        },
        reservationId.toString(),
      );
    } else {
      this._logger.error(
        `Update reservation failed. ReservationId not found by CorrelationId ${message.context.correlationId}.`,
      );
    }
  }

  @AsHandler(CallAction.ReserveNow)
  protected async _handleReserveNow(
    message: IMessage<ReserveNowResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('ReserveNowResponse received:', message, props);

    const reservationId = await this._findReservationByCorrelationId(
      message.context.correlationId,
    );
    if (reservationId) {
      const status = message.payload.status as ReserveNowStatusEnumType;
      await this._reservationRepository.updateByKey(
        {
          reserveStatus: status,
          isActive: status === ReserveNowStatusEnumType.Accepted,
        },
        reservationId.toString(),
      );
    } else {
      this._logger.error(
        `Update reservation failed. ReservationId not found by CorrelationId ${message.context.correlationId}.`,
      );
    }
  }

  @AsHandler(CallAction.UnlockConnector)
  protected async _handleUnlockConnector(
    message: IMessage<UnlockConnectorResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('UnlockConnectorResponse received:', message, props);
  }

  @AsHandler(CallAction.ClearCache)
  protected async _handleClearCache(
    message: IMessage<ClearCacheResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('ClearCacheResponse received:', message, props);
  }

  @AsHandler(CallAction.SendLocalList)
  protected async _handleSendLocalList(
    message: IMessage<SendLocalListResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('SendLocalListResponse received:', message, props);

    const stationId = message.context.stationId;

    const sendLocalListRequest = await this._localAuthListRepository.getSendLocalListRequestByStationIdAndCorrelationId(stationId, message.context.correlationId);

    if (!sendLocalListRequest) {
      this._logger.error(`Unable to process SendLocalListResponse. SendLocalListRequest not found for StationId ${stationId} by CorrelationId ${message.context.correlationId}.`);
      return;
    }

    const sendLocalListResponse = message.payload;

    switch (sendLocalListResponse.status) {
      case SendLocalListStatusEnumType.Accepted:
        this._localAuthListRepository.createOrUpdateLocalListVersionFromStationIdAndSendLocalList(stationId, sendLocalListRequest);
        break;
      case SendLocalListStatusEnumType.Failed:
      case SendLocalListStatusEnumType.VersionMismatch:
        break;
      default:
        this._logger.error(`Unknown SendLocalListStatusEnumType: ${sendLocalListResponse.status}.`);
        break;
    }
  }

  @AsHandler(CallAction.GetLocalListVersion)
  protected async _handleGetLocalListVersion(
    message: IMessage<GetLocalListVersionResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('GetLocalListVersionResponse received:', message, props);

    await this._localAuthListRepository.validateOrReplaceLocalListVersionForStation(message.payload.versionNumber, message.context.stationId);
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
