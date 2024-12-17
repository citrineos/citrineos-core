import {
  Authorization,
  IAuthorizationRepository,
  ITransactionEventRepository,
  Transaction,
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
    const totalKwh = MeterValueUtils.getTotalKwh(
      await this._transactionEventRepository.readAllMeterValuesByTransactionDataBaseId(
        transactionDbId,
      ),
    );

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
    const idTokenInfo: OCPP2_0_1.IdTokenInfoType = {
      status: authorization.idTokenInfo.status,
      cacheExpiryDateTime: authorization.idTokenInfo.cacheExpiryDateTime,
      chargingPriority: authorization.idTokenInfo.chargingPriority,
      language1: authorization.idTokenInfo.language1,
      evseId: authorization.idTokenInfo.evseId,
      groupIdToken: authorization.idTokenInfo.groupIdToken
        ? {
            additionalInfo:
              authorization.idTokenInfo.groupIdToken.additionalInfo &&
              authorization.idTokenInfo.groupIdToken.additionalInfo.length > 0
                ? (authorization.idTokenInfo.groupIdToken.additionalInfo.map(
                    (additionalInfo) => ({
                      additionalIdToken: additionalInfo.additionalIdToken,
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
