import {
  Authorization,
  IAuthorizationRepository,
  ITransactionEventRepository,
  Transaction,
  OCPP1_6_Mapper,
  OCPP2_0_1_Mapper,
  IReservationRepository,
} from '@citrineos/data';
import {
  IMessageContext,
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
  private _logger: Logger<ILogObj>;
  private _authorizers: IAuthorizer[];

  constructor(
    transactionEventRepository: ITransactionEventRepository,
    authorizeRepository: IAuthorizationRepository,
    reservationRepository: IReservationRepository,
    authorizers?: IAuthorizer[],
    logger?: Logger<ILogObj>,
  ) {
    this._transactionEventRepository = transactionEventRepository;
    this._authorizeRepository = authorizeRepository;
    this._reservationRepository = reservationRepository;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
    this._authorizers = authorizers || [];
  }

  async recalculateTotalKwh(transactionDbId: number) {
    const meterValues = await this._transactionEventRepository.readAllMeterValuesByTransactionDataBaseId(
      transactionDbId,
    );
    const meterValueTypes = meterValues.map(
      meterValue => OCPP2_0_1_Mapper.MeterValueMapper.toMeterValueType(meterValue)
    );
    const totalKwh = MeterValueUtils.getTotalKwh(meterValueTypes);

    await Transaction.update(
      { totalKwh: totalKwh },
      { where: { id: transactionDbId }, returning: false },
    );

    this._logger.debug(
      `Recalculated ${totalKwh} kWh for ${transactionDbId} transaction`,
    );
    return totalKwh;
  }

  async authorizeIdToken(
    transactionEvent: OCPP2_0_1.TransactionEventRequest,
    messageContext: IMessageContext,
  ): Promise<OCPP2_0_1.TransactionEventResponse> {
    const idToken = transactionEvent.idToken!;
    const authorizations = await this._authorizeRepository.readAllByQuerystring(
      { ...idToken },
    );

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

    if (
      idTokenInfo.cacheExpiryDateTime &&
      new Date() > new Date(idTokenInfo.cacheExpiryDateTime)
    ) {
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
      if (transactionEvent.eventType === OCPP2_0_1.TransactionEventEnumType.Started) {
        const hasConcurrent = await this._hasConcurrentTransactions(idToken);
        if (hasConcurrent) {
          response.idTokenInfo.status =
            OCPP2_0_1.AuthorizationStatusEnumType.ConcurrentTx;
        }
      }
    }
    this._logger.debug(
      'idToken Authorization final status:',
      response.idTokenInfo.status,
    );
    return response;
  }

  async createMeterValues(
    meterValues: [OCPP2_0_1.MeterValueType, ...OCPP2_0_1.MeterValueType[]],
    transactionDbId?: number | null,
  ) {
    return Promise.all(meterValues.map(async (meterValue) => {
      const hasPeriodic: boolean = meterValue.sampledValue?.some(
        (s) => s.context === OCPP2_0_1.ReadingContextEnumType.Sample_Periodic,
      );
      if (transactionDbId && hasPeriodic) {
        await this._transactionEventRepository.createMeterValue(
          meterValue,
          transactionDbId,
        );
      } else {
        await this._transactionEventRepository.createMeterValue(meterValue);
      }
    }));
  }

  async authorizeOcpp16IdToken(
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
      const authorization =
        await this._authorizeRepository.readOnlyOneByQuerystring({
          idToken: idToken,
          type: null,
        });
      if (!authorization) {
        this._logger.error(`Found no authorization for idToken: ${idToken}`);
        return response;
      }

      // Check expiration
      const idTokenInfo = authorization.idTokenInfo;
      if (!idTokenInfo) {
        response.idTagInfo.status =
          OCPP1_6.StartTransactionResponseStatus.Accepted;
        return response;
      }

      const idTokenInfoStatus = OCPP1_6_Mapper.AuthorizationMapper.toStartTransactionResponseStatus(
        idTokenInfo.status
      );
      if (idTokenInfoStatus !== OCPP1_6.StartTransactionResponseStatus.Accepted) {
        response.idTagInfo.status = idTokenInfoStatus;
        return response;
      }

      if (
        idTokenInfo.cacheExpiryDateTime &&
        new Date() > new Date(idTokenInfo.cacheExpiryDateTime)
      ) {
        response.idTagInfo.status =
          OCPP1_6.StartTransactionResponseStatus.Expired;
        return response;
      }

      // Check concurrent transactions
      const activeTransactions =
        await this._transactionEventRepository.readAllActiveTransactionsIncludeStartTransactionByIdToken(
          authorization.idToken.idToken,
        );
      if (activeTransactions.length > 0) {
        response.idTagInfo.status =
          OCPP1_6.StartTransactionResponseStatus.ConcurrentTx;
        return response;
      }

      // Accept the idToken
      response.idTagInfo.status =
        OCPP1_6.StartTransactionResponseStatus.Accepted;
      response.idTagInfo.expiryDate = idTokenInfo.cacheExpiryDateTime;
      response.idTagInfo.parentIdTag = idTokenInfo.groupIdToken
        ? idTokenInfo.groupIdToken.idToken
        : undefined;
      return response;
    } catch (e) {
      this._logger.error(`Authorization for idToken ${idToken} failed.`, e);
      response.idTagInfo.status =
        OCPP1_6.StartTransactionResponseStatus.Invalid;
      return response;
    }
  }

  async deactivateReservation(
    transactionId: string,
    reservationId: number,
    stationId: string,
  ): Promise<void> {
    await this._reservationRepository.updateAllByQuery(
      {
        terminatedByTransaction: transactionId,
        isActive: false,
      },
      {
        where: {
          id: reservationId,
          stationId: stationId,
        },
      },
    );
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
    idToken: OCPP2_0_1.IdTokenType,
  ): Promise<boolean> {
    const activeTransactions =
      await this._transactionEventRepository.readAllActiveTransactionsIncludeTransactionEventByIdToken(
        idToken,
      );

    return activeTransactions.length > 1;
  }
}
