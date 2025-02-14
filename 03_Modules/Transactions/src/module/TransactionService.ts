import {
  Authorization,
  IAuthorizationRepository,
  ITransactionEventRepository,
  Transaction,
  OCPP2_0_1_Mapper,
} from '@citrineos/data';
import {
  IMessageContext,
  MeterValueUtils,
  OCPP2_0_1
} from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import { IAuthorizer } from '@citrineos/util';

export class TransactionService {
  private _transactionEventRepository: ITransactionEventRepository;
  private _authorizeRepository: IAuthorizationRepository;
  private _logger: Logger<ILogObj>;
  private _authorizers: IAuthorizer[];

  constructor(
    transactionEventRepository: ITransactionEventRepository,
    authorizeRepository: IAuthorizationRepository,
    authorizers?: IAuthorizer[],
    logger?: Logger<ILogObj>,
  ) {
    this._transactionEventRepository = transactionEventRepository;
    this._authorizeRepository = authorizeRepository;
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
      await this._transactionEventRepository.readAllActiveTransactionsByIdToken(
        idToken,
      );

    return activeTransactions.length > 1;
  }
}
