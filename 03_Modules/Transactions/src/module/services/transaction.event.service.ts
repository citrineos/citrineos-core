import { inject, singleton } from "tsyringe";
import { v4 as uuidv4 } from "uuid";
import {
  AttributeEnumType,
  AuthorizationStatusEnumType,
  BaseModule,
  CacheNamespace,
  CacheService,
  CallAction,
  CostUpdatedRequest,
  EventGroup,
  HandlerProperties,
  IdTokenEnumType,
  IdTokenInfoType,
  IdTokenType,
  IMessage,
  IMessageConfirmation,
  LoggerService,
  MeasurandEnumType,
  MessageOrigin,
  OcppRequest,
  OcppResponse,
  ReadingContextEnumType,
  RequestBuilder,
  SampledValueType,
  SystemConfigService,
  TransactionEventEnumType,
  TransactionEventRequest,
  TransactionEventResponse,
} from "@citrineos/base";
import {
  AuthorizationRepository,
  DeviceModelRepository,
  MeterValue,
  Tariff,
  TariffRepository,
  Transaction,
  TransactionEventRepository,
  VariableAttribute,
} from "@citrineos/data";
import { RabbitMqSender } from "@citrineos/util";
import { TransactionEventMapper } from "../mappers/transaction.event.mapper";

@singleton()
export class TransactionEventService {
  eventGroup = EventGroup.Transactions;

  readonly sendCostUpdatedOnMeterValue?: boolean;
  readonly costUpdatedInterval?: number;

  constructor(
    @inject(LoggerService) private readonly loggerService?: LoggerService,
    @inject(RabbitMqSender) private readonly sender?: RabbitMqSender, // todo inject generic sender not RabbitMq specific
    @inject(TransactionEventRepository)
    private readonly transactionEventRepository?: TransactionEventRepository,
    @inject(TariffRepository)
    private readonly tariffRepository?: TariffRepository,
    @inject(AuthorizationRepository)
    private readonly authorizeRepository?: AuthorizationRepository,
    @inject(DeviceModelRepository)
    private readonly deviceModelRepository?: DeviceModelRepository,
    @inject(TransactionEventMapper)
    private readonly transactionEventMapper?: TransactionEventMapper,
    @inject(SystemConfigService)
    private readonly configService?: SystemConfigService,
    @inject(CacheService) private readonly cacheService?: CacheService
  ) {
    console.log("TransactionEventService constructor");

    this.sendCostUpdatedOnMeterValue =
      this.configService?.systemConfig.modules.transactions.sendCostUpdatedOnMeterValue;
    this.costUpdatedInterval =
      this.configService?.systemConfig.modules.transactions.costUpdatedInterval;
  }

  async handleTransactionEvent(
    message: IMessage<TransactionEventRequest>,
    props?: HandlerProperties
  ) {
    const stationId: string = message.context.stationId;

    this.loggerService?.logger?.debug(
      "Transaction event received:",
      message,
      props
    );

    // todo add try catch around awaits for proper error handling
    await this.transactionEventRepository?.createOrUpdateTransactionByTransactionEventAndStationId(
      message.payload,
      stationId
    );

    const transactionEventRequest = message.payload;
    if (transactionEventRequest.idToken) {
      const transactionEventResponse: TransactionEventResponse =
        await this.authorizeAndGetTransactionEventResponse(
          transactionEventRequest
        );

      await this.sendTransactionEventConfirmationIfNeeded(
        message,
        transactionEventRequest,
        transactionEventResponse
      );
    } else {
      let transactionEventResponse: TransactionEventResponse = {
        // TODO determine how to set chargingPriority and updatedPersonalMessage for anonymous users
      };

      const transaction: Transaction | undefined =
        await this.transactionEventRepository?.readTransactionByStationIdAndTransactionId(
          stationId,
          transactionEventRequest.transactionInfo.transactionId
        );

      transactionEventResponse = await this.handleEventTypeUpdated(
        message,
        transactionEventResponse,
        transaction
      );

      transactionEventResponse = await this.handleEventTypeEnded(
        message,
        transactionEventResponse,
        transaction
      );

      this.sendCallResultWithMessage(message, transactionEventResponse).then(
        (messageConfirmation) => {
          this.loggerService?.logger.debug(
            "Transaction response sent: ",
            messageConfirmation
          );
        }
      );
    }
  }

  private async handleEventTypeEnded(
    message: IMessage<TransactionEventRequest>,
    transactionEventResponse: TransactionEventResponse,
    transaction: Transaction | undefined
  ) {
    if (
      message.payload.eventType == TransactionEventEnumType.Ended &&
      transaction
    ) {
      transactionEventResponse.totalCost = await this._calculateTotalCost(
        message.context.stationId,
        transaction.id
      );
    }
    return transactionEventResponse;
  }

  private async handleEventTypeUpdated(
    message: IMessage<TransactionEventRequest>,
    transactionEventResponse: TransactionEventResponse,
    transaction: Transaction | undefined
  ) {
    if (message.payload.eventType == TransactionEventEnumType.Updated) {
      // I02 - Show EV Driver Running Total Cost During Charging
      if (
        transaction &&
        transaction.isActive &&
        this.sendCostUpdatedOnMeterValue
      ) {
        transactionEventResponse.totalCost = await this._calculateTotalCost(
          message.context.stationId,
          transaction.id
        );
      }

      // I06 - Update Tariff Information During Transaction
      const tariffAvailableAttributes: VariableAttribute[] =
        await this.deviceModelRepository?.readAllByQuery({
          stationId: message.context.stationId,
          component_name: "TariffCostCtrlr",
          variable_instance: "Tariff",
          variable_name: "Available",
          type: AttributeEnumType.Actual,
        })!;
      const supportTariff: boolean =
        tariffAvailableAttributes.length !== 0 &&
        Boolean(tariffAvailableAttributes[0].value);

      if (supportTariff && transaction && transaction.isActive) {
        this.loggerService?.logger.debug(
          `Checking if updated tariff information is available for traction ${transaction.transactionId}`
        );
        // TODO: checks if there is updated tariff information available and set it in the PersonalMessage field.
      }
    }
    return transactionEventResponse;
  }

  private async sendTransactionEventConfirmationIfNeeded(
    message: IMessage<TransactionEventRequest>,
    transactionEventRequest: TransactionEventRequest,
    transactionEventResponse: TransactionEventResponse
  ) {
    if (
      transactionEventRequest.eventType == TransactionEventEnumType.Started &&
      transactionEventResponse &&
      transactionEventResponse.idTokenInfo?.status ==
        AuthorizationStatusEnumType.Accepted &&
      transactionEventRequest.idToken
    ) {
      if (this.costUpdatedInterval) {
        this.updateCost(
          message.context.stationId,
          transactionEventRequest.transactionInfo.transactionId,
          this.costUpdatedInterval,
          message.context.tenantId
        );
      }

      await this.setConcurrentTransaction(
        transactionEventRequest,
        transactionEventResponse
      );
    }
    // todo here no confirmation will be sent back, this is incorrect behavior right?
  }

  private async sendTransactionEventConfirmation(
    message: IMessage<TransactionEventRequest>,
    transactionEventResponse: TransactionEventResponse
  ) {
    const messageConfirmation = await this.sendCallResultWithMessage(
      message,
      transactionEventResponse as TransactionEventResponse
    );
    this.loggerService?.logger?.debug(
      "Transaction response sent: ",
      messageConfirmation
    );
  }

  async setConcurrentTransaction(
    transactionEventRequest: TransactionEventRequest,
    transactionEventResponse: TransactionEventResponse
  ) {
    // Check for ConcurrentTx
    const activeTransactions =
      await this.transactionEventRepository?.readAllActiveTransactionsByIdToken(
        transactionEventRequest.idToken as IdTokenType
      );

    // Transaction in this TransactionEventRequest has already been saved, so there should only be 1 active transaction for idToken
    if (activeTransactions!.length > 1) {
      const groupIdToken = transactionEventResponse.idTokenInfo?.groupIdToken;
      transactionEventResponse.idTokenInfo = {
        status: AuthorizationStatusEnumType.ConcurrentTx,
        groupIdToken: groupIdToken,
        // TODO determine how/if to set personalMessage
      };
    }
  }

  private async authorizeAndGetTransactionEventResponse(
    transactionEvent: TransactionEventRequest
  ) {
    const authorization = await this.authorizeRepository?.readByQuery({
      idToken: transactionEvent.idToken?.idToken as string,
      type: transactionEvent.idToken?.type as IdTokenEnumType,
    });
    const transactionEventResponse: TransactionEventResponse = {
      idTokenInfo: {
        status: AuthorizationStatusEnumType.Unknown,
        // TODO determine how/if to set personalMessage
      },
    };
    if (authorization) {
      if (authorization.idTokenInfo) {
        // Extract DTO fields from sequelize Model<any, any> objects
        const idTokenInfo =
          this.transactionEventMapper?.mapAuthorizationToIdTokenInfo(
            authorization
          )!;
        this.setTransactionEventResponseTokenInfo(
          transactionEventResponse,
          idTokenInfo
        );
      } else {
        // Assumed to always be valid without IdTokenInfo
        transactionEventResponse.idTokenInfo = {
          status: AuthorizationStatusEnumType.Accepted,
          // TODO determine how/if to set personalMessage
        };
      }
    }
    return transactionEventResponse;
  }

  private setTransactionEventResponseTokenInfo(
    transactionEventResponse: TransactionEventResponse,
    idTokenInfo: IdTokenInfoType
  ) {
    if (idTokenInfo.status == AuthorizationStatusEnumType.Accepted) {
      if (
        idTokenInfo.cacheExpiryDateTime &&
        new Date() > new Date(idTokenInfo.cacheExpiryDateTime)
      ) {
        transactionEventResponse.idTokenInfo = {
          status: AuthorizationStatusEnumType.Invalid,
          groupIdToken: idTokenInfo.groupIdToken,
          // TODO determine how/if to set personalMessage
        };
      } else {
        // TODO: Determine how to check for NotAllowedTypeEVSE, NotAtThisLocation, NotAtThisTime, NoCredit
        // TODO: allow for a 'real time auth' type call to fetch token status.
        transactionEventResponse.idTokenInfo = idTokenInfo;
      }
    } else {
      // IdTokenInfo.status is one of Blocked, Expired, Invalid, NoCredit
      // N.B. Other non-Accepted statuses should not be allowed to be stored.
      transactionEventResponse.idTokenInfo = idTokenInfo;
    }
  }

  public sendCallResultWithMessage(
    message: IMessage<OcppRequest>,
    payload: OcppResponse
  ): Promise<IMessageConfirmation> {
    return this.sender?.sendResponse(message, payload)!;
  }

  /**
   * Round floor the given cost to 2 decimal places, e.g., given 1.2378, return 1.23
   *
   * @param {number} cost - cost
   * @return {number} rounded cost
   */
  private _roundCost(cost: number): number {
    return Math.floor(cost * 100) / 100;
  }

  private async _calculateTotalCost(
    stationId: string,
    transactionDbId: number
  ): Promise<number> {
    // TODO: This is a temp workaround. We need to refactor the calculation of totalCost when tariff
    //  implementation is finalized
    let totalCost: number = 0;

    const tariff: Tariff | null = await this.tariffRepository?.findByStationId(
      stationId
    )!;
    if (tariff) {
      this.loggerService?.logger.debug(
        `Tariff ${tariff.id} found for station ${stationId}`
      );
      const totalKwh = this._getTotalKwh(
        await this.transactionEventRepository?.readAllMeterValuesByTransactionDataBaseId(
          transactionDbId
        )!
      );
      this.loggerService?.logger.debug(`TotalKwh: ${totalKwh}`);
      await Transaction.update(
        { totalKwh: totalKwh },
        { where: { id: transactionDbId }, returning: false }
      );
      totalCost = this._roundCost(totalKwh * tariff.price);
    } else {
      this.loggerService?.logger.error(
        `Tariff not found for station ${stationId}`
      );
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
    const contexts: ReadingContextEnumType[] = [
      ReadingContextEnumType.Transaction_Begin,
      ReadingContextEnumType.Sample_Periodic,
      ReadingContextEnumType.Transaction_End,
    ];

    let valuesMap = new Map();

    meterValues
      .filter(
        (meterValue) =>
          meterValue.sampledValue[0].context &&
          contexts.indexOf(meterValue.sampledValue[0].context) !== -1
      )
      .forEach((meterValue) => {
        const sampledValues = meterValue.sampledValue as SampledValueType[];
        const overallValue = sampledValues.find(
          (sampledValue) =>
            sampledValue.phase === undefined &&
            sampledValue.measurand ==
              MeasurandEnumType.Energy_Active_Import_Register
        );
        if (
          overallValue &&
          overallValue.unitOfMeasure?.unit?.toUpperCase() === "KWH"
        ) {
          valuesMap.set(Date.parse(meterValue.timestamp), overallValue.value);
        } else if (
          overallValue &&
          overallValue.unitOfMeasure?.unit?.toUpperCase() === "WH"
        ) {
          valuesMap.set(
            Date.parse(meterValue.timestamp),
            overallValue.value / 1000
          );
        }
      });

    // sort the map based on timestamps
    valuesMap = new Map(
      [...valuesMap.entries()].sort((v1, v2) => v1[0] - v2[0])
    );
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
  private updateCost(
    stationId: string,
    transactionId: string,
    costUpdatedInterval: number,
    tenantId: string
  ): void {
    setInterval(async () => {
      const transaction: Transaction | undefined =
        await this.transactionEventRepository?.readTransactionByStationIdAndTransactionId(
          stationId,
          transactionId
        );
      if (transaction && transaction.isActive) {
        const cost = await this._calculateTotalCost(stationId, transaction.id);
        this.sendCall(stationId, tenantId, CallAction.CostUpdated, {
          totalCost: cost,
          transactionId: transaction.transactionId,
        } as CostUpdatedRequest).then(() => {
          this.loggerService?.logger.info(
            `Sent costUpdated for ${transaction.transactionId} with totalCost ${cost}`
          );
        });
      }
    }, costUpdatedInterval * 1000);
  }

  // todo move to base service?
  /**
   * Sends a call with the specified identifier, tenantId, action, payload, and origin.
   *
   * @param {string} identifier - The identifier of the call.
   * @param {string} tenantId - The tenant ID.
   * @param {CallAction} action - The action to be performed.
   * @param {OcppRequest} payload - The payload of the call.
   * @param {string} [callbackUrl] - The callback URL for the call.
   * @param {string} [correlationId] - The correlation ID of the call.
   * @param {MessageOrigin} [origin] - The origin of the call.
   * @return {Promise<IMessageConfirmation>} A promise that resolves to the message confirmation.
   */
  public sendCall(
    identifier: string,
    tenantId: string,
    action: CallAction,
    payload: OcppRequest,
    callbackUrl?: string,
    correlationId?: string,
    origin?: MessageOrigin
  ): Promise<IMessageConfirmation> {
    const _correlationId: string =
      correlationId == undefined ? uuidv4() : correlationId;
    if (callbackUrl) {
      // TODO: Handle callErrors, failure to send to charger, timeout from charger, with different responses to callback
      this.cacheService?.cache.set(
        _correlationId,
        callbackUrl,
        BaseModule.CALLBACK_URL_CACHE_PREFIX + identifier,
        this.configService?.systemConfig.maxCachingSeconds
      );
    }
    // TODO: Future - Compound key with tenantId
    return this.cacheService?.cache
      .get(identifier, CacheNamespace.Connections)
      .then((connection) => {
        if (connection) {
          return this.sender?.sendRequest(
            RequestBuilder.buildCall(
              identifier,
              _correlationId,
              tenantId,
              action,
              payload,
              this.eventGroup,
              origin
            )
          );
        } else {
          this.loggerService?.logger.error(
            "Failed sending call. No connection found for identifier: ",
            identifier
          );
          return Promise.resolve({
            success: false,
            payload: "No connection found for identifier: " + identifier,
          });
        }
      }) as Promise<IMessageConfirmation>;
  }
}
