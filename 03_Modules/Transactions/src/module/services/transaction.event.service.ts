import { inject, singleton } from "tsyringe";
import {
  AdditionalInfoType,
  AuthorizationStatusEnumType,
  HandlerProperties,
  IdTokenInfoType,
  IMessage,
  IMessageConfirmation,
  LoggerService,
  OcppRequest,
  OcppResponse,
  TransactionEventEnumType,
  TransactionEventRequest,
  TransactionEventResponse,
} from "@citrineos/base";
import {
  AuthorizationRepository,
  TransactionEventRepository,
} from "@citrineos/data";
import { RabbitMqSender } from "@citrineos/util";

@singleton()
export class TransactionEventService {
  constructor(
    @inject(LoggerService) private readonly loggerService?: LoggerService,
    @inject(RabbitMqSender) private readonly sender?: RabbitMqSender, // todo inject generic sender not RabbitMq specific
    @inject(TransactionEventRepository)
    private readonly transactionEventRepository?: TransactionEventRepository,
    @inject(AuthorizationRepository)
    private readonly authorizeRepository?: AuthorizationRepository
  ) {
    console.log("TransactionEventService constructor");
  }

  async handleTransactionEvent(
    message: IMessage<TransactionEventRequest>,
    props?: HandlerProperties
  ) {
    this.loggerService?.logger?.debug(
      "Transaction event received:",
      message,
      props
    );

    await this.transactionEventRepository?.createOrUpdateTransactionByTransactionEventAndStationId(
      message.payload,
      message.context.stationId
    );

    const transactionEvent = message.payload;
    if (transactionEvent.idToken) {
      this.authorizeRepository
        ?.readByQuery({ ...transactionEvent.idToken })
        .then((authorization) => {
          const response: TransactionEventResponse = {
            idTokenInfo: {
              status: AuthorizationStatusEnumType.Unknown,
              // TODO determine how/if to set personalMessage
            },
          };
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
                              (additionalInfo) => {
                                return {
                                  additionalIdToken:
                                    additionalInfo.additionalIdToken,
                                  type: additionalInfo.type,
                                };
                              }
                            ) as [AdditionalInfoType, ...AdditionalInfoType[]])
                          : undefined,
                      idToken: authorization.idTokenInfo.groupIdToken.idToken,
                      type: authorization.idTokenInfo.groupIdToken.type,
                    }
                  : undefined,
                language2: authorization.idTokenInfo.language2,
                personalMessage: authorization.idTokenInfo.personalMessage,
              };

              if (idTokenInfo.status == AuthorizationStatusEnumType.Accepted) {
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
                status: AuthorizationStatusEnumType.Accepted,
                // TODO determine how/if to set personalMessage
              };
            }
          }
          return response;
        })
        .then((transactionEventResponse) => {
          if (
            transactionEvent.eventType == TransactionEventEnumType.Started &&
            transactionEventResponse &&
            transactionEventResponse.idTokenInfo?.status ==
              AuthorizationStatusEnumType.Accepted &&
            transactionEvent.idToken
          ) {
            // Check for ConcurrentTx
            return this.transactionEventRepository
              ?.readAllActiveTransactionByIdToken(transactionEvent.idToken)
              .then((activeTransactions) => {
                // Transaction in this TransactionEventRequest has already been saved, so there should only be 1 active transaction for idToken
                if (activeTransactions.length > 1) {
                  const groupIdToken =
                    transactionEventResponse.idTokenInfo?.groupIdToken;
                  transactionEventResponse.idTokenInfo = {
                    status: AuthorizationStatusEnumType.ConcurrentTx,
                    groupIdToken: groupIdToken,
                    // TODO determine how/if to set personalMessage
                  };
                }
                return transactionEventResponse;
              });
          }
          return transactionEventResponse;
        })
        .then((transactionEventResponse: any) => {
          this.sendCallResultWithMessage(
            message,
            transactionEventResponse
          ).then((messageConfirmation) =>
            this.loggerService?.logger?.debug(
              "Transaction response sent: ",
              messageConfirmation
            )
          );
        });
    } else {
      const response: TransactionEventResponse = {
        // TODO determine how to set chargingPriority and updatedPersonalMessage for anonymous users
      };
      this.sendCallResultWithMessage(message, response).then(
        (messageConfirmation) =>
          this.loggerService?.logger?.debug(
            "Transaction response sent: ",
            messageConfirmation
          )
      );
    }
  }

  public sendCallResultWithMessage(
    message: IMessage<OcppRequest>,
    payload: OcppResponse
  ): Promise<IMessageConfirmation> {
    return this.sender?.sendResponse(message, payload)!;
  }
}
