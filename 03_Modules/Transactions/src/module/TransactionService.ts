import {
  Authorization,
  IAuthorizationRepository,
  ITransactionEventRepository,
} from '@citrineos/data';
import {
  AdditionalInfoType,
  AuthorizationStatusEnumType,
  IdTokenInfoType,
  IdTokenType,
  IMessageContext,
  TransactionEventResponse,
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
    logger: Logger<ILogObj>,
    authorizers?: IAuthorizer[],
  ) {
    this._transactionEventRepository = transactionEventRepository;
    this._authorizeRepository = authorizeRepository;
    this._logger = logger;
    this._authorizers = authorizers || [];
  }

  async authorizeIdToken(
    idToken: IdTokenType,
    messageContext: IMessageContext,
  ): Promise<TransactionEventResponse> {
    const authorizations = await this._authorizeRepository.readAllByQuerystring(
      { ...idToken },
    );

    const response: TransactionEventResponse = {
      idTokenInfo: {
        status: AuthorizationStatusEnumType.Unknown,
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
        status: AuthorizationStatusEnumType.Accepted,
        // TODO determine how/if to set personalMessage
      };
      return response;
    }

    // Extract DTO fields from sequelize Model<any, any> objects
    const idTokenInfo: IdTokenInfoType = {
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
                  ) as [AdditionalInfoType, ...AdditionalInfoType[]])
                : undefined,
            idToken: authorization.idTokenInfo.groupIdToken.idToken,
            type: authorization.idTokenInfo.groupIdToken.type,
          }
        : undefined,
      language2: authorization.idTokenInfo.language2,
      personalMessage: authorization.idTokenInfo.personalMessage,
    };

    if (idTokenInfo.status !== AuthorizationStatusEnumType.Accepted) {
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
        status: AuthorizationStatusEnumType.Invalid,
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
      const hasConcurrent = await this._hasConcurrentTransactions(idToken);
      if (hasConcurrent) {
        response.idTokenInfo.status = AuthorizationStatusEnumType.ConcurrentTx;
      }
    }
    this._logger.debug(
      'idToken Authorization final status:',
      response.idTokenInfo.status,
    );
    return response;
  }

  private async _applyAuthorizers(
    idTokenInfo: IdTokenInfoType,
    authorization: Authorization,
    messageContext: IMessageContext,
  ): Promise<IdTokenInfoType> {
    for (const authorizer of this._authorizers) {
      if (idTokenInfo.status !== AuthorizationStatusEnumType.Accepted) {
        break;
      }
      const result: Partial<IdTokenType> = await authorizer.authorize(
        authorization,
        messageContext,
      );
      Object.assign(idTokenInfo, result);
    }
    return idTokenInfo;
  }

  private async _hasConcurrentTransactions(
    idToken: IdTokenType,
  ): Promise<boolean> {
    const activeTransactions =
      await this._transactionEventRepository.readAllActiveTransactionsByIdToken(
        idToken,
      );

    return activeTransactions.length > 1;
  }
}
