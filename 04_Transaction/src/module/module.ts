/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */

import {
  AbstractModule,
  AdditionalInfoType,
  AsHandler,
  AuthorizationStatusEnumType,
  CallAction,
  ChargingStateEnumType,
  EventGroup,
  HandlerProperties,
  ICache,
  IMessage,
  IMessageHandler,
  IMessageSender,
  IdTokenInfoType,
  MeterValuesRequest,
  MeterValuesResponse,
  SystemConfig,
  TransactionEventEnumType,
  TransactionEventRequest,
  TransactionEventResponse
} from "@citrineos/base";
import { IAuthorizationRepository, ITransactionEventRepository, sequelize } from "@citrineos/data";
import { PubSubReceiver, PubSubSender, Timer } from "@citrineos/util";
import deasyncPromise from "deasync-promise";
import { ILogObj, Logger } from 'tslog';

/**
 * Component that handles transaction related messages.
 */
export class TransactionModule extends AbstractModule {

  protected _requests: CallAction[] = [CallAction.TransactionEvent, CallAction.MeterValues];
  protected _responses: CallAction[] = [CallAction.RequestStartTransaction, CallAction.RequestStopTransaction, CallAction.GetTransactionStatus];

  protected _transactionEventRepository: ITransactionEventRepository;
  protected _authorizeRepository: IAuthorizationRepository;

  get transactionEventRepository(): ITransactionEventRepository {
    return this._transactionEventRepository;
  }

  get authorizeRepository(): IAuthorizationRepository {
    return this._authorizeRepository;
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
   * If no `transactionEventRepository` is provided, a default {@link sequelize.TransactionEventRepository} instance is created and used.
   * 
   * @param {IAuthorizationRepository} [authorizeRepository] - An optional parameter of type {@link IAuthorizationRepository} which represents a repository for accessing and manipulating variable data.
   * If no `authorizeRepository` is provided, a default {@link sequelize.AuthorizationRepository} instance is created and used.
   */
  constructor(
    config: SystemConfig,
    cache: ICache,
    sender?: IMessageSender,
    handler?: IMessageHandler,
    logger?: Logger<ILogObj>,
    transactionEventRepository?: ITransactionEventRepository,
    authorizeRepository?: IAuthorizationRepository
  ) {
    super(config, cache, handler || new PubSubReceiver(config, logger), sender || new PubSubSender(config, logger), EventGroup.Transaction, logger);

    const timer = new Timer();
    this._logger.info(`Initializing...`);

    if (!deasyncPromise(this._initHandler(this._requests, this._responses))) {
      throw new Error("Could not initialize module due to failure in handler initialization.");
    }

    this._transactionEventRepository = transactionEventRepository || new sequelize.TransactionEventRepository(config, logger);
    this._authorizeRepository = authorizeRepository || new sequelize.AuthorizationRepository(config, logger);

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

    await this._transactionEventRepository.createByStationId(message.payload, message.context.stationId);

    const transactionEvent = message.payload;
    if (transactionEvent.idToken) {
      this._logger.info("1");
      this._authorizeRepository.readByQuery({ ...transactionEvent.idToken }).then(authorization => {
        const response: TransactionEventResponse = {
          idTokenInfo: {
            status: AuthorizationStatusEnumType.Unknown
            // TODO determine how/if to set personalMessage
          }
        };
        this._logger.info("2");
        if (authorization) {
          if (authorization.idTokenInfo) {
            this._logger.info("3");
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

            this._logger.info("4");
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
        this._logger.info("5");
        return response;
      }).then(transactionEventResponse => {
        this._logger.info("6");
        if (transactionEvent.eventType == TransactionEventEnumType.Started && transactionEventResponse
          && transactionEventResponse.idTokenInfo?.status == AuthorizationStatusEnumType.Accepted && transactionEvent.idToken) {
            this._logger.info("7");
          // Check for ConcurrentTx
          return this._transactionEventRepository.readAllActiveTransactionByIdToken(transactionEvent.idToken).then(activeTransactions => {
            // Transaction in this TransactionEventRequest has already been saved, so there should only be 1 active transaction for idToken
            if (activeTransactions.length > 1) {
              this._logger.info("8");
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
        this._logger.info("9");
        this.sendCallResultWithMessage(message, transactionEventResponse)
          .then(messageConfirmation => this._logger.debug("Transaction response sent:", messageConfirmation));
      });
    } else {
      this._logger.info("10");
      const response: TransactionEventResponse = {
        // TODO determine how to set chargingPriority and updatedPersonalMessage for anonymous users
      };
      this.sendCallResultWithMessage(message, response)
        .then(messageConfirmation => this._logger.debug("Transaction response sent:", messageConfirmation));
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

    const response: MeterValuesResponse = {
      // TODO determine how to set chargingPriority and updatedPersonalMessage for anonymous users
    };
    this.sendCallResultWithMessage(message, response)
  }
}