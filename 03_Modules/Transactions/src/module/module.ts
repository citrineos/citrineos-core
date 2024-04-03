// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModule,
  AdditionalInfoType,
  AsHandler, AttributeEnumType,
  AuthorizationStatusEnumType,
  CallAction, CostUpdatedRequest,
  CostUpdatedResponse,
  EventGroup,
  GetTransactionStatusResponse,
  HandlerProperties,
  ICache,
  IdTokenInfoType,
  IMessage,
  IMessageHandler,
  IMessageSender, MeasurandEnumType,
  MeterValuesRequest,
  MeterValuesResponse, ReadingContextEnumType, SampledValueType,
  StatusNotificationRequest,
  StatusNotificationResponse,
  SystemConfig,
  TransactionEventEnumType,
  TransactionEventRequest,
  TransactionEventResponse
} from "@citrineos/base";
import {
  IAuthorizationRepository,
  IDeviceModelRepository, ITariffRepository,
  ITransactionEventRepository,
  sequelize
} from "@citrineos/data";
import { RabbitMqReceiver, RabbitMqSender, Timer} from "@citrineos/util";
import deasyncPromise from "deasync-promise";
import { ILogObj, Logger } from 'tslog';
import { MeterValue, Tariff, Transaction, VariableAttribute } from "@citrineos/data/lib/layers/sequelize";

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

  private readonly _sendCostUpdatedOnMeterValue: boolean | undefined;
  private readonly _costUpdatedInterval: number | undefined;

  protected _transactionEventRepository: ITransactionEventRepository;
  protected _authorizeRepository: IAuthorizationRepository;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _tariffRepository: ITariffRepository;

  get transactionEventRepository(): ITransactionEventRepository {
    return this._transactionEventRepository;
  }

  get authorizeRepository(): IAuthorizationRepository {
    return this._authorizeRepository;
  }

  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }

  get tariffRepository(): ITariffRepository {
    return this._tariffRepository;
  }

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
   *
   * @param {ITariffRepository} [tariffRepository] - An optional parameter of type {@link ITariffRepository} which
   * represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize:tariffRepository} instance is
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
    deviceModelRepository?: IDeviceModelRepository,
    tariffRepository?: ITariffRepository
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
    this._tariffRepository = tariffRepository || new sequelize.TariffRepository(config, logger);

    this._sendCostUpdatedOnMeterValue = config.modules.transactions.sendCostUpdatedOnMeterValue;
    this._costUpdatedInterval = config.modules.transactions.costUpdatedInterval;

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
    const stationId: string = message.context.stationId;

    await this._transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId(message.payload, stationId);

    const transactionEvent = message.payload;
    const transactionId = transactionEvent.transactionInfo.transactionId;
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
        if (transactionEvent.eventType == TransactionEventEnumType.Started && transactionEventResponse
            && transactionEventResponse.idTokenInfo?.status == AuthorizationStatusEnumType.Accepted && transactionEvent.idToken) {

          if(this._costUpdatedInterval) {
            this._updateCost(stationId, transactionId, this._costUpdatedInterval, message.context.tenantId)
          }

          // Check for ConcurrentTx
          return this._transactionEventRepository.readAllActiveTransactionsByIdToken(transactionEvent.idToken).then(activeTransactions => {
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

      const transaction: Transaction | undefined = await this._transactionEventRepository.readTransactionByStationIdAndTransactionId(stationId, transactionId);

      if (message.payload.eventType == TransactionEventEnumType.Updated) {
        // I02 - Show EV Driver Running Total Cost During Charging
        if (transaction && transaction.isActive && this._sendCostUpdatedOnMeterValue) {
          response.totalCost = await this._calculateTotalCost(stationId, transaction.id);
        }

        // I06 - Update Tariff Information During Transaction
        const tariffAvailableAttributes: VariableAttribute[] = await this._deviceModelRepository.readAllByQuery({
          stationId: stationId,
          component_name: 'TariffCostCtrlr',
          variable_instance: 'Tariff',
          variable_name: 'Available',
          type: AttributeEnumType.Actual
        });
        const supportTariff: boolean = tariffAvailableAttributes.length !== 0 && Boolean(tariffAvailableAttributes[0].value);

        if (supportTariff && transaction && transaction.isActive) {
          this._logger.debug(`Checking if updated tariff information is available for traction ${transaction.transactionId}`);
          // TODO: checks if there is updated tariff information available and set it in the PersonalMessage field.
        }
      }

      if (message.payload.eventType == TransactionEventEnumType.Ended && transaction) {
        response.totalCost = await this._calculateTotalCost(stationId, transaction.id);
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
    // TODO: If sendCostUpdatedOnMeterValue is true, meterValues handler triggers cost update
    //  when it is added into a transaction

    const response: MeterValuesResponse = {
      // TODO determine how to set chargingPriority and updatedPersonalMessage for anonymous users
    };

    this.sendCallResultWithMessage(message, response).then(messageConfirmation => {
      this._logger.debug("MeterValues response sent: ", messageConfirmation)
    })
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

  /**
   * Round floor the given cost to 2 decimal places, e.g., given 1.2378, return 1.23
   *
   * @param {number} cost - cost
   * @return {number} rounded cost
   */
  private _roundCost(cost: number): number {
    return Math.floor(cost * 100) / 100
  }

  private async _calculateTotalCost(stationId: string, transactionDbId: number): Promise<number> {
    // TODO: This is a temp workaround. We need to refactor the calculation of totalCost when tariff
    //  implementation is finalized
    let totalCost: number = 0;

    const tariff: Tariff | null = await this._tariffRepository.findByStationId(stationId);
    if (tariff) {
      this._logger.debug(`Tariff ${tariff.id} found for station ${stationId}`);
      const totalKwh = this._getTotalKwh(await this._transactionEventRepository.readAllMeterValuesByTransactionDataBaseId(transactionDbId));
      this._logger.debug(`TotalKwh: ${totalKwh}`);
      await Transaction.update({totalKwh: totalKwh}, {where: {id: transactionDbId}, returning: false});
      totalCost = this._roundCost(totalKwh * tariff.price);
    } else {
      this._logger.error(`Tariff not found for station ${stationId}`);
    }

    return totalCost;
  }

  /**
   * Calculate the total Kwh
   *
   * @param {array} meterValues - meterValues of a transaction.
   * @return {number} total Kwh based on the overall values (i.e., without phase) in the simpledValues.
   */
  private _getTotalKwh(meterValues: MeterValue[]): number {
    const contexts: ReadingContextEnumType[] = [ReadingContextEnumType.Transaction_Begin, ReadingContextEnumType.Sample_Periodic, ReadingContextEnumType.Transaction_End];

    let valuesMap = new Map();

    meterValues.filter(meterValue => meterValue.sampledValue[0].context && contexts.indexOf(meterValue.sampledValue[0].context) !== -1).forEach(
        meterValue => {
          const sampledValues = meterValue.sampledValue as SampledValueType[];
          const overallValue = sampledValues.find(sampledValue => sampledValue.phase === undefined && sampledValue.measurand == MeasurandEnumType.Energy_Active_Import_Register);
          if (overallValue && overallValue.unitOfMeasure?.unit?.toUpperCase() === 'KWH') {
            valuesMap.set(Date.parse(meterValue.timestamp), overallValue.value)
          } else if (overallValue && overallValue.unitOfMeasure?.unit?.toUpperCase() === 'WH') {
            valuesMap.set(Date.parse(meterValue.timestamp), overallValue.value / 1000)
          }
        }
    );

    // sort the map based on timestamps
    valuesMap = new Map([...valuesMap.entries()].sort((v1, v2) => v1[0] - v2[0]));
    const sortedValues = Array.from(valuesMap.values());

    let totalKwh: number = 0;
    for (let i = 1; i < sortedValues.length; i++) {
      totalKwh += sortedValues[i] - sortedValues[i - 1];
    }

    return totalKwh;
  }

  /**
   * Internal method to execute a costUpdated request for an ongoing transaction repeatedly based on the costUpdatedInterval
   *
   * @param {string} stationId - The identifier of the client connection.
   * @param {string} transactionId - The identifier of the transaction.
   * @param {number} costUpdatedInterval - The costUpdated interval in milliseconds.
   * @param {string} tenantId - The identifier of the tenant.
   * @return {void} This function does not return anything.
   */
  private _updateCost(stationId: string, transactionId: string, costUpdatedInterval: number, tenantId: string): void {
    setInterval(async () => {
      const transaction: Transaction | undefined = await this._transactionEventRepository.readTransactionByStationIdAndTransactionId(stationId, transactionId);
      if (transaction && transaction.isActive) {
        const cost = await this._calculateTotalCost(stationId, transaction.id);
        this.sendCall(stationId, tenantId, CallAction.CostUpdated, {
          totalCost: cost,
          transactionId: transaction.transactionId
        } as CostUpdatedRequest).then(() => {
          this._logger.info(`Sent costUpdated for ${transaction.transactionId} with totalCost ${cost}`,);
        })
      }
    }, costUpdatedInterval * 1000);
  }
}