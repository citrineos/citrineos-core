import { inject, singleton } from "tsyringe";
import {
  AuthorizationStatusEnumType,
  HandlerProperties,
  IdTokenEnumType,
  IdTokenInfoType,
  IdTokenType,
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
import { TransactionEventMapper } from "../mappers/transaction.event.mapper";

@singleton()
export class TransactionEventService {
  constructor(
    @inject(LoggerService) private readonly loggerService?: LoggerService,
    @inject(RabbitMqSender) private readonly sender?: RabbitMqSender, // todo inject generic sender not RabbitMq specific
    @inject(TransactionEventRepository)
    private readonly transactionEventRepository?: TransactionEventRepository,
    @inject(AuthorizationRepository)
    private readonly authorizeRepository?: AuthorizationRepository,
    @inject(TransactionEventMapper)
    private readonly transactionEventMapper?: TransactionEventMapper
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

    // todo add try catch around awaits for proper error handling
    await this.transactionEventRepository?.createOrUpdateTransactionByTransactionEventAndStationId(
      message.payload,
      message.context.stationId
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
      await this.sendTransactionEventConfirmation(message, {
        // TODO determine how to set chargingPriority and updatedPersonalMessage for anonymous users
      });
    }
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
      await this.transactionEventRepository?.readAllActiveTransactionByIdToken(
        transactionEventRequest.idToken as IdTokenType
      );

    // Transaction in this TransactionEventRequest has already been saved, so there should only be 1 active transaction for idToken
    if (activeTransactions!.length > 1) {
      transactionEventResponse.idTokenInfo = {
        status: AuthorizationStatusEnumType.ConcurrentTx,
        // groupIdToken: transactionEventResponse.idTokenInfo?.groupIdToken, // todo line seems to not do anything
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
}
