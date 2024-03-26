// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  AdditionalInfoType,
  AsHandler,
  AuthorizationStatusEnumType,
  CallAction,
  CostUpdatedResponse,
  EventGroup,
  GetTransactionStatusResponse,
  HandlerProperties,
  ICache,
  IdTokenInfoType,
  IMessage,
  IMessageHandler,
  IMessageSender,
  MeterValuesRequest,
  MeterValuesResponse,
  StatusNotificationRequest,
  StatusNotificationResponse,
  SystemConfig,
  TransactionEventEnumType,
  TransactionEventRequest,
  TransactionEventResponse
} from "@citrineos/base";
import {
  IAuthorizationRepository,
  IDeviceModelRepository,
  ITransactionEventRepository,
  sequelize
} from "@citrineos/data";
import {RabbitMqReceiver, RabbitMqSender, Timer} from "@citrineos/util";
import deasyncPromise from "deasync-promise";
import {ILogObj, Logger} from 'tslog';
import {DeviceModelService} from "./services";
import {Transaction} from "@citrineos/data/lib/layers/sequelize";

/**
 * Component that handles transaction related messages.
 */
export class TransactionsModule extends AbstractModule {

  protected _requests: CallAction[] = [
    CallAction.MeterValues,
    CallAction.StatusNotification,
    CallAction.TransactionEvent
  ];
  protected _responses: CallAction[] = [
    CallAction.CostUpdated,
    CallAction.GetTransactionStatus
  ];

  protected _transactionEventRepository: ITransactionEventRepository;
  protected _authorizeRepository: IAuthorizationRepository;
  protected _deviceModelRepository: IDeviceModelRepository;

  get transactionEventRepository(): ITransactionEventRepository {
    return this._transactionEventRepository;
  }

  get authorizeRepository(): IAuthorizationRepository {
    return this._authorizeRepository;
  }

  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }

  public _deviceModelService: DeviceModelService;

  /**
   * This is the constructor function that initializes the {@link TransactionModule}.
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
   * @param {ITransactionEventRepository} [transactionEventRepository] - An optional parameter of type {@link ITransactionEventRepository} which represents a repository for accessing and manipulating authorization data.
   * If no `transactionEventRepository` is provided, a default {@link sequelize:transactionEventRepository} instance
   * is created and used.
   * 
   * @param {IAuthorizationRepository} [authorizeRepository] - An optional parameter of type {@link IAuthorizationRepository} which represents a repository for accessing and manipulating variable data.
   * If no `authorizeRepository` is provided, a default {@link sequelize:authorizeRepository} instance is
   * created and used.
   *
   * @param {IDeviceModelRepository} [deviceModelRepository] - An optional parameter of type {@link IDeviceModelRepository} which represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize:deviceModelRepository} instance is
   * created and used.
   */
  constructor(
    config: SystemConfig,
    cache: ICache,
    sender?: IMessageSender,
    handler?: IMessageHandler,
    logger?: Logger<ILogObj>,
    transactionEventRepository?: ITransactionEventRepository,
    authorizeRepository?: IAuthorizationRepository,
    deviceModelRepository?: IDeviceModelRepository
  ) {
    super(config, cache, handler || new RabbitMqReceiver(config, logger), sender || new RabbitMqSender(config, logger), EventGroup.Transactions, logger);

    const timer = new Timer();
    this._logger.info(`Initializing...`);

    if (!deasyncPromise(this._initHandler(this._requests, this._responses))) {
      throw new Error("Could not initialize module due to failure in handler initialization.");
    }

    this._transactionEventRepository = transactionEventRepository || new sequelize.TransactionEventRepository(config, logger);
    this._authorizeRepository = authorizeRepository || new sequelize.AuthorizationRepository(config, logger);
    this._deviceModelRepository = deviceModelRepository || new sequelize.DeviceModelRepository(config, logger);

    this._deviceModelService = new DeviceModelService(this._deviceModelRepository);

    this._logger.info(`Initialized in ${timer.end()}ms...`);
  }

  /**
   * Handle requests
   */

  @AsHandler(CallAction.TransactionEvent)
  protected async _handleTransactionEvent(
    message: IMessage<TransactionEventRequest>,
    props?: HandlerProperties
  ): Promise<void> {
    this._logger.debug("Transaction event received:", message, props);

    await this._transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId(message.payload, message.context.stationId);

    const transactionEvent = message.payload;
    if (transactionEvent.idToken) {
      this._authorizeRepository.readByQuery({ ...transactionEvent.idToken }).then(authorization => {
        const response: TransactionEventResponse = {
          idTokenInfo: {
            status: AuthorizationStatusEnumType.Unknown
            // TODO determine how/if to set personalMessage
          }
        };
        if (authorization) {
          if (authorization.idTokenInfo) {
            // Extract DTO fields from sequelize Model<any, any> objects
            const idTokenInfo: IdTokenInfoType = {
              status: authorization.idTokenInfo.status,
              cacheExpiryDateTime: authorization.idTokenInfo.cacheExpiryDateTime,
              chargingPriority: authorization.idTokenInfo.chargingPriority,
              language1: authorization.idTokenInfo.language1,
              evseId: authorization.idTokenInfo.evseId,
              groupIdToken: authorization.idTokenInfo.groupIdToken ? {
                additionalInfo: (authorization.idTokenInfo.groupIdToken.additionalInfo && authorization.idTokenInfo.groupIdToken.additionalInfo.length > 0) ? (authorization.idTokenInfo.groupIdToken.additionalInfo.map(additionalInfo => {
                  return {
                    additionalIdToken: additionalInfo.additionalIdToken,
                    type: additionalInfo.type
                  }
                }) as [AdditionalInfoType, ...AdditionalInfoType[]]) : undefined,
                idToken: authorization.idTokenInfo.groupIdToken.idToken,
                type: authorization.idTokenInfo.groupIdToken.type
              } : undefined,
              language2: authorization.idTokenInfo.language2,
              personalMessage: authorization.idTokenInfo.personalMessage
            };

            if (idTokenInfo.status == AuthorizationStatusEnumType.Accepted) {
              if (idTokenInfo.cacheExpiryDateTime &&
                new Date() > new Date(idTokenInfo.cacheExpiryDateTime)) {
                response.idTokenInfo = {
                  status: AuthorizationStatusEnumType.Invalid,
                  groupIdToken: idTokenInfo.groupIdToken
                  // TODO determine how/if to set personalMessage
                };
              } else {
                // TODO: Determine how to check for NotAllowedTypeEVSE, NotAtThisLocation, NotAtThisTime, NoCredit
                // TODO: allow for a 'real time auth' type call to fetch token status.
                response.idTokenInfo = idTokenInfo;
              }
            } else {
              // IdTokenInfo.status is one of Blocked, Expired, Invalid, NoCredit
              // N.B. Other non-Accepted statuses should not be allowed to be stored.
              response.idTokenInfo = idTokenInfo;
            }
          } else {
            // Assumed to always be valid without IdTokenInfo
            response.idTokenInfo = {
              status: AuthorizationStatusEnumType.Accepted
              // TODO determine how/if to set personalMessage
            };
          }
        }
        return response;
      }).then(transactionEventResponse => {
        if (transactionEventResponse
          && transactionEventResponse.idTokenInfo?.status == AuthorizationStatusEnumType.Accepted && transactionEvent.idToken) {
          if(transactionEvent.eventType == TransactionEventEnumType.Started) {
            // Check for ConcurrentTx
            return this._transactionEventRepository.readAllActiveTransactionByIdToken(transactionEvent.idToken).then(activeTransactions => {
              // Transaction in this TransactionEventRequest has already been saved, so there should only be 1 active transaction for idToken
              if (activeTransactions.length > 1) {
                const groupIdToken = transactionEventResponse.idTokenInfo?.groupIdToken;
                transactionEventResponse.idTokenInfo = {
                  status: AuthorizationStatusEnumType.ConcurrentTx,
                  groupIdToken: groupIdToken
                  // TODO determine how/if to set personalMessage
                }
              }
              return transactionEventResponse;
            });
          } else if (transactionEvent.eventType == TransactionEventEnumType.Ended) {
            // TODO: determine whether this is a free transaction and set the totalCost to 0.00
            // TODO: otherwise calculate final cost of the transaction and set it in the totalCost field
            // TODO: return the updated transactionEventResponse
          }
        }
        return transactionEventResponse;
      }).then(transactionEventResponse => {
        this.sendCallResultWithMessage(message, transactionEventResponse)
            .then(messageConfirmation => {
              this._logger.debug("Transaction response sent: ", messageConfirmation)
            });
      });
    } else {
      const response: TransactionEventResponse = {
        // TODO determine how to set chargingPriority and updatedPersonalMessage for anonymous users
      };

      if (message.payload.eventType == TransactionEventEnumType.Updated) {
        // I02 - Show EV Driver Running Total Cost During Charging
        // TODO: set the running cost corresponding to the timestamp and meterValue in the field totalCost in response

        // I06 - Update Tariff Information During Transaction
        const supportTariff: boolean | null = await this._deviceModelService.getTariffAvailableByStationId(message.context.stationId);
        const transaction: Transaction | undefined = await this._transactionEventRepository.readTransactionByStationIdAndTransactionId(message.context.stationId, transactionEvent.transactionInfo.transactionId);
        if (supportTariff && transaction && transaction.isActive) {
          // TODO: checks if there is updated tariff information available and set it in the PersonalMessage field.
        }
      }

      this.sendCallResultWithMessage(message, response)
          .then(messageConfirmation => {
            this._logger.debug("Transaction response sent: ", messageConfirmation)
          });
    }
  }

  @AsHandler(CallAction.MeterValues)
  protected async _handleMeterValues(
    message: IMessage<MeterValuesRequest>,
    props?: HandlerProperties
  ): Promise<void> {
    this._logger.debug("MeterValues received:", message, props);

    // TODO: Add meterValues to transactions
    // TODO: Meter values can be triggered. Ideally, it should be sent to the callbackUrl from the message api that sent the trigger message

    const response: MeterValuesResponse = {
      // TODO determine how to set chargingPriority and updatedPersonalMessage for anonymous users
    };
    this.sendCallResultWithMessage(message, response)
  }

  @AsHandler(CallAction.StatusNotification)
  protected _handleStatusNotification(
    message: IMessage<StatusNotificationRequest>,
    props?: HandlerProperties
  ): void {

    this._logger.debug("StatusNotification received:", message, props);

    // Create response
    const response: StatusNotificationResponse = {};

    this.sendCallResultWithMessage(message, response)
        .then(messageConfirmation => {
          this._logger.debug("StatusNotification response sent: ", messageConfirmation)
        });
  }

  /**
   * Handle responses
   */
  
  @AsHandler(CallAction.CostUpdated)
  protected _handleCostUpdated(
    message: IMessage<CostUpdatedResponse>,
    props?: HandlerProperties
  ): void {
    this._logger.debug("CostUpdated response received:", message, props);
  }
  
  @AsHandler(CallAction.GetTransactionStatus)
  protected _handleGetTransactionStatus(
    message: IMessage<GetTransactionStatusResponse>,
    props?: HandlerProperties
  ): void {
    this._logger.debug("GetTransactionStatus response received:", message, props);
  }
}