// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  Authorization,
  IAuthorizationRepository,
  IdToken,
  IReservationRepository,
  ITransactionEventRepository,
  OCPP1_6_Mapper,
  OCPP2_0_1_Mapper,
  Transaction,
} from '@citrineos/data';
import {
  IMessageContext,
  MeterValueUtils,
  OCPP1_6,
  OCPP2_0_1,
  TransactionEventType,
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
    const storedMeterValues =
      await this._transactionEventRepository.readAllMeterValuesByTransactionDataBaseId(
        transactionDbId,
      );
    const meterValueMappers = storedMeterValues.map((meterValue) =>
      OCPP2_0_1_Mapper.MeterValueMapper.fromModel(meterValue),
    );
    const totalKwh = MeterValueUtils.getTotalKwh(meterValueMappers);

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
    const idTokenInfoMapper = OCPP2_0_1_Mapper.IdTokenInfoMapper.fromModel(
      authorization.idTokenInfo,
    );
    const idTokenInfo: OCPP2_0_1.IdTokenInfoType = {
      status: idTokenInfoMapper.status,
      cacheExpiryDateTime: idTokenInfoMapper.cacheExpiryDateTime,
      chargingPriority: idTokenInfoMapper.chargingPriority,
      language1: idTokenInfoMapper.language1,
      evseId: idTokenInfoMapper.evseId,
      groupIdToken: idTokenInfoMapper.groupIdToken
        ? {
            additionalInfo: idTokenInfoMapper.groupIdToken.additionalInfo,
            idToken: idTokenInfoMapper.groupIdToken.idToken,
            type: idTokenInfoMapper.groupIdToken.type,
          }
        : undefined,
      language2: idTokenInfoMapper.language2,
      personalMessage: idTokenInfoMapper.personalMessage,
    };

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
      if (
        transactionEvent.eventType ===
        OCPP2_0_1.TransactionEventEnumType.Started
      ) {
        const hasConcurrent = await this._hasConcurrentTransactions(
          authorization.idToken,
          TransactionEventType.transactionEvent,
        );
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

  async validateOcpp16IdToken(
    idToken: string,
    startTransaction: boolean,
  ): Promise<OCPP1_6.IdTagInfo> {

    try {
      // Find authorization
      const authorization = await this._authorizeRepository.readOnlyOneByQuerystring({
        idToken: idToken,
        type: null,
      });

      const idTagInfo: OCPP1_6.IdTagInfo = OCPP1_6Mapper.fromModel(authorization);

      if (!authorization) {
        this._logger.error(`Found no authorization for idToken: ${idToken}`);
        return idTagInfoMapper;
      }

      // Check expiration
      const idTokenInfo = authorization.idTokenInfo;
      if (!idTokenInfo) {
        idTagInfoMapper.status = OCPP1_6.AuthorizeResponseStatus.Accepted;
        return idTagInfoMapper;
      }
      if (
        idTokenInfo.cacheExpiryDateTime &&
        new Date() > new Date(idTokenInfo.cacheExpiryDateTime)
      ) {
        idTagInfoMapper.status = OCPP1_6.AuthorizeResponseStatus.Expired;
        return idTagInfoMapper;
      }

      // Check concurrent transactions for start transaction only
      if (startTransaction) {
        const hasConcurrent = await this._hasConcurrentTransactions(
          authorization.idToken,
          TransactionEventType.startTransaction,
        );
        if (hasConcurrent) {
          idTagInfoMapper.status = OCPP1_6.AuthorizeResponseStatus.ConcurrentTx;
          return idTagInfoMapper;
        }
      }

      // Accept the idToken
      idTagInfoMapper.status = OCPP1_6.AuthorizeResponseStatus.Accepted;

      return idTagInfoMapper;
    } catch (e) {
      this._logger.error(
        `Failed to find authorization for idToken: ${idToken}`,
        e,
      );
      return idTagInfoMapper;
    }
  }

  mapAuthorizeResponseStatusToStartTransactionResponseStatus(
    status: OCPP1_6.AuthorizeResponseStatus,
  ): OCPP1_6.StartTransactionResponseStatus {
    switch (status) {
      case OCPP1_6.AuthorizeResponseStatus.Accepted:
        return OCPP1_6.StartTransactionResponseStatus.Accepted;
      case OCPP1_6.AuthorizeResponseStatus.Expired:
        return OCPP1_6.StartTransactionResponseStatus.Expired;
      case OCPP1_6.AuthorizeResponseStatus.Blocked:
        return OCPP1_6.StartTransactionResponseStatus.Blocked;
      case OCPP1_6.AuthorizeResponseStatus.ConcurrentTx:
        return OCPP1_6.StartTransactionResponseStatus.ConcurrentTx;
      default:
        return OCPP1_6.StartTransactionResponseStatus.Invalid;
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
    idToken: IdToken,
    transactionEventType: TransactionEventType,
  ): Promise<boolean> {
    const activeTransactions =
      await this._transactionEventRepository.readAllActiveTransactionsByIdTokenAndTransactionEventType(
        idToken,
        transactionEventType,
      );

    // For TransactionEvent in OCPP 2.0.1, a new transaction has been created
    // before checking the concurrent transactions, so concurrent transactions
    // should be 2 or more, including the new one and existing ones
    if (transactionEventType === TransactionEventType.transactionEvent) {
      return activeTransactions.length > 1;
    } else {
      return activeTransactions.length > 0;
    }
  }
}
