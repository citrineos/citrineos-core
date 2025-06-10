import {
  Authorization,
  IAuthorizationRepository,
  ITransactionEventRepository,
  Transaction,
  OCPP1_6_Mapper,
  OCPP2_0_1_Mapper,
  IReservationRepository,
  IOCPPMessageRepository,
} from '@citrineos/data';
import {
  IMessageContext,
  MessageOrigin,
  MeterValueUtils,
  OCPP1_6,
  OCPP2_0_1,
} from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import { IAuthorizer } from '@citrineos/util';

export class TransactionService {
  private _transactionEventRepository: ITransactionEventRepository;
  private _authorizeRepository: IAuthorizationRepository;
  private _reservationRepository: IReservationRepository;
  private _ocppMessageRepository: IOCPPMessageRepository;
  private _logger: Logger<ILogObj>;
  private _authorizers: IAuthorizer[];

  constructor(
    transactionEventRepository: ITransactionEventRepository,
    authorizeRepository: IAuthorizationRepository,
    reservationRepository: IReservationRepository,
    ocppMessageRepository: IOCPPMessageRepository,
    authorizers?: IAuthorizer[],
    logger?: Logger<ILogObj>,
  ) {
    this._transactionEventRepository = transactionEventRepository;
    this._authorizeRepository = authorizeRepository;
    this._reservationRepository = reservationRepository;
    this._ocppMessageRepository = ocppMessageRepository;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
    this._authorizers = authorizers || [];
  }

  async recalculateTotalKwh(tenantId: number, transactionDbId: number) {
    const meterValues =
      await this._transactionEventRepository.readAllMeterValuesByTransactionDataBaseId(
        tenantId,
        transactionDbId,
      );
    const meterValueTypes = meterValues.map((meterValue) =>
      OCPP2_0_1_Mapper.MeterValueMapper.toMeterValueType(meterValue),
    );
    const totalKwh = MeterValueUtils.getTotalKwh(meterValueTypes);

    await Transaction.update(
      { totalKwh: totalKwh },
      { where: { id: transactionDbId }, returning: false },
    );

    this._logger.debug(`Recalculated ${totalKwh} kWh for ${transactionDbId} transaction`);
    return totalKwh;
  }

  async authorizeIdToken(
    tenantId: number,
    transactionEvent: OCPP2_0_1.TransactionEventRequest,
    messageContext: IMessageContext,
  ): Promise<OCPP2_0_1.TransactionEventResponse> {
    const idToken = transactionEvent.idToken!;
    const authorizations = await this._authorizeRepository.readAllByQuerystring(tenantId, {
      ...idToken,
    });

    const response: OCPP2_0_1.TransactionEventResponse = {
      idTokenInfo: {
        status: OCPP2_0_1.AuthorizationStatusEnumType.Unknown,
        // TODO determine how/if to set personalMessage
      },
    };

    if (authorizations.length !== 1) {
      return response;
    }
    const authorization = authorizations[0];
    if (!authorization.idTokenInfo) {
      // Assumed to always be valid without IdTokenInfo
      response.idTokenInfo = {
        status: OCPP2_0_1.AuthorizationStatusEnumType.Accepted,
        // TODO determine how/if to set personalMessage
      };
      return response;
    }

    // Extract DTO fields from sequelize Model<any, any> objects
    const idTokenInfo = OCPP2_0_1_Mapper.AuthorizationMapper.toIdTokenInfo(authorization);

    if (idTokenInfo.status !== OCPP2_0_1.AuthorizationStatusEnumType.Accepted) {
      // IdTokenInfo.status is one of Blocked, Expired, Invalid, NoCredit
      // N.B. Other non-Accepted statuses should not be allowed to be stored.
      response.idTokenInfo = idTokenInfo;
      return response;
    }

    if (idTokenInfo.cacheExpiryDateTime && new Date() > new Date(idTokenInfo.cacheExpiryDateTime)) {
      response.idTokenInfo = {
        status: OCPP2_0_1.AuthorizationStatusEnumType.Invalid,
        groupIdToken: idTokenInfo.groupIdToken,
        // TODO determine how/if to set personalMessage
      };
      return response;
    } else {
      response.idTokenInfo = await this._applyAuthorizers(
        idTokenInfo,
        authorization,
        messageContext,
      );
      if (authorization.concurrentTransaction === true) {
        if (transactionEvent.eventType === OCPP2_0_1.TransactionEventEnumType.Started) {
          const hasConcurrent = await this._hasConcurrentTransactions(tenantId, idToken);
          if (hasConcurrent) {
            response.idTokenInfo.status = OCPP2_0_1.AuthorizationStatusEnumType.ConcurrentTx;
          }
        }
      }
    }
    this._logger.debug('idToken Authorization final status:', response.idTokenInfo.status);
    return response;
  }

  async createMeterValues(
    tenantId: number,
    meterValues: [OCPP2_0_1.MeterValueType, ...OCPP2_0_1.MeterValueType[]],
    transactionDbId?: number | null,
  ) {
    return Promise.all(
      meterValues.map(async (meterValue) => {
        const hasPeriodic: boolean = meterValue.sampledValue?.some(
          (s) => s.context === OCPP2_0_1.ReadingContextEnumType.Sample_Periodic,
        );
        if (transactionDbId && hasPeriodic) {
          await this._transactionEventRepository.createMeterValue(
            tenantId,
            meterValue,
            transactionDbId,
          );
        } else {
          await this._transactionEventRepository.createMeterValue(tenantId, meterValue);
        }
      }),
    );
  }

  async authorizeOcpp16IdToken(
    tenantId: number,
    idToken: string,
  ): Promise<OCPP1_6.StartTransactionResponse> {
    const response: OCPP1_6.StartTransactionResponse = {
      idTagInfo: {
        status: OCPP1_6.StartTransactionResponseStatus.Invalid,
      },
      transactionId: 0, // default zero for rejected transaction
    };

    try {
      // Find authorization
      const authorizations = await this._authorizeRepository.readAllByQuerystring(tenantId, {
        idToken: idToken,
        type: null,
      });
      if (authorizations.length !== 1) {
        this._logger.error(
          `Found invalid authorizations ${JSON.stringify(authorizations)} for idToken: ${idToken}`,
        );
        return response;
      }

      // Check expiration
      const idTokenInfo = authorizations[0].idTokenInfo;
      if (!idTokenInfo) {
        response.idTagInfo.status = OCPP1_6.StartTransactionResponseStatus.Accepted;
        return response;
      }

      const idTokenInfoStatus = OCPP1_6_Mapper.AuthorizationMapper.toStartTransactionResponseStatus(
        idTokenInfo.status,
      );
      if (idTokenInfoStatus !== OCPP1_6.StartTransactionResponseStatus.Accepted) {
        response.idTagInfo.status = idTokenInfoStatus;
        return response;
      }

      if (
        idTokenInfo.cacheExpiryDateTime &&
        new Date() > new Date(idTokenInfo.cacheExpiryDateTime)
      ) {
        response.idTagInfo.status = OCPP1_6.StartTransactionResponseStatus.Expired;
        return response;
      }

      // Check concurrent transactions
      const activeTransactions =
        await this._transactionEventRepository.readAllActiveTransactionsIncludeStartTransactionByIdToken(
          tenantId,
          authorizations[0].idToken.idToken,
        );
      if (activeTransactions.length > 0) {
        response.idTagInfo.status = OCPP1_6.StartTransactionResponseStatus.ConcurrentTx;
        return response;
      }

      // Accept the idToken
      response.idTagInfo.status = OCPP1_6.StartTransactionResponseStatus.Accepted;
      response.idTagInfo.expiryDate = idTokenInfo.cacheExpiryDateTime;
      response.idTagInfo.parentIdTag = idTokenInfo.groupIdToken
        ? idTokenInfo.groupIdToken.idToken
        : undefined;
      return response;
    } catch (e) {
      this._logger.error(`Authorization for idToken ${idToken} failed.`, e);
      response.idTagInfo.status = OCPP1_6.StartTransactionResponseStatus.Invalid;
      return response;
    }
  }

  async deactivateReservation(
    tenantId: number,
    transactionId: string,
    reservationId: number,
    stationId: string,
  ): Promise<void> {
    await this._reservationRepository.updateAllByQuery(
      tenantId,
      {
        terminatedByTransaction: transactionId,
        isActive: false,
      },
      {
        where: {
          tenantId,
          id: reservationId,
          stationId: stationId,
        },
      },
    );
  }

  async updateTransactionStatus(
    tenantId: number,
    stationId: string,
    correlationId: string,
    ongoingIndicator: boolean,
  ) {
    const request = await this._ocppMessageRepository.readOnlyOneByQuery(tenantId, {
      where: {
        tenantId,
        stationId,
        correlationId,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });
    if (!request) {
      this._logger.error(
        `No valid GetTransactionStatusRequest found for correlationId ${correlationId}`,
      );
      return;
    }

    const transactionId = request.message[3].transactionId;
    if (!transactionId) {
      this._logger.error(`No valid transactionId found from the message ${request.message[3]}`);
      return;
    }

    const updatedTransaction =
      await this._transactionEventRepository.updateTransactionByStationIdAndTransactionId(
        tenantId,
        { isActive: ongoingIndicator },
        transactionId,
        stationId,
      );
    if (!updatedTransaction) {
      this._logger.error(`Update transaction ${transactionId} failed.`);
    }
    this._logger.info(`Updated transaction ${transactionId} isActive to ${ongoingIndicator}`);
  }

  private async _applyAuthorizers(
    idTokenInfo: OCPP2_0_1.IdTokenInfoType,
    authorization: Authorization,
    messageContext: IMessageContext,
  ): Promise<OCPP2_0_1.IdTokenInfoType> {
    for (const authorizer of this._authorizers) {
      if (idTokenInfo.status !== OCPP2_0_1.AuthorizationStatusEnumType.Accepted) {
        break;
      }
      const result: Partial<OCPP2_0_1.IdTokenType> = await authorizer.authorize(
        authorization,
        messageContext,
      );
      Object.assign(idTokenInfo, result);
    }
    return idTokenInfo;
  }

  private async _hasConcurrentTransactions(
    tenantId: number,
    idToken: OCPP2_0_1.IdTokenType,
  ): Promise<boolean> {
    const activeTransactions =
      await this._transactionEventRepository.readAllActiveTransactionsIncludeTransactionEventByIdToken(
        tenantId,
        idToken,
      );

    return activeTransactions.length > 1;
  }
}
