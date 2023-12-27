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

import { AbstractModule, CallAction, SystemConfig, ICache, IMessageSender, IMessageHandler, EventGroup, AsHandler, IMessage, AuthorizeRequest, HandlerProperties, AuthorizeResponse, IdTokenInfoType, AdditionalInfoType, AttributeEnumType, AuthorizationStatusEnumType } from "@citrineos/base";
import { IAuthorizationRepository, IDeviceModelRepository, sequelize } from "@citrineos/data";
import { VariableAttribute } from "@citrineos/data/lib/layers/sequelize";
import { RabbitMqReceiver, RabbitMqSender, Timer } from "@citrineos/util";
import deasyncPromise from "deasync-promise";
import { ILogObj, Logger } from 'tslog';

/**
 * Component that handles provisioning related messages.
 */
export class EVDriverModule extends AbstractModule {

  /**
   * Fields
   */
  protected _requests: CallAction[] = [CallAction.Authorize];
  protected _responses: CallAction[] = [CallAction.ClearCache];

  protected _authorizeRepository: IAuthorizationRepository;
  protected _deviceModelRepository: IDeviceModelRepository;

  get authorizeRepository(): IAuthorizationRepository {
    return this._authorizeRepository;
  }

  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }

  /**
   * This is the constructor function that initializes the {@link EVDriverModule}.
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
   * @param {IAuthorizationRepository} [authorizeRepository] - An optional parameter of type {@link IAuthorizationRepository} which represents a repository for accessing and manipulating Authorization data.
   * If no `authorizeRepository` is provided, a default {@link sequelize.AuthorizationRepository} instance is created and used.
   * 
   * @param {IDeviceModelRepository} [deviceModelRepository] - An optional parameter of type {@link IDeviceModelRepository} which represents a repository for accessing and manipulating variable data.
   * If no `deviceModelRepository` is provided, a default {@link sequelize.DeviceModelRepository} instance is created and used.
   */
  constructor(
    config: SystemConfig,
    cache: ICache,
    sender?: IMessageSender,
    handler?: IMessageHandler,
    logger?: Logger<ILogObj>,
    authorizeRepository?: IAuthorizationRepository,
    deviceModelRepository?: IDeviceModelRepository
  ) {
    super(config, cache, handler || new RabbitMqReceiver(config, logger), sender || new RabbitMqSender(config, logger), EventGroup.EVDriver, logger);

    const timer = new Timer();
    this._logger.info(`Initializing...`);

    if (!deasyncPromise(this._initHandler(this._requests, this._responses))) {
      throw new Error("Could not initialize module due to failure in handler initialization.");
    }

    this._authorizeRepository = authorizeRepository || new sequelize.AuthorizationRepository(config, logger);
    this._deviceModelRepository = deviceModelRepository || new sequelize.DeviceModelRepository(config, logger);

    this._logger.info(`Initialized in ${timer.end()}ms...`);
  }

  /**
   * Handle requests
   */

  @AsHandler(CallAction.Authorize)
  protected _handleAuthorize(
    message: IMessage<AuthorizeRequest>,
    props?: HandlerProperties
  ): void {

    this._logger.debug("Authorize received:", message, props);

    this._authorizeRepository.readByQuery({ ...message.payload.idToken }).then(async authorization => {
      const response: AuthorizeResponse = {
        idTokenInfo: {
          status: AuthorizationStatusEnumType.Unknown
          // TODO determine how/if to set personalMessage
        }
      };
      if (authorization) {
        if (authorization.idTokenInfo) {
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
              })  as [AdditionalInfoType, ...AdditionalInfoType[]]) : undefined,
              idToken: authorization.idTokenInfo.groupIdToken.idToken,
             type: authorization.idTokenInfo.groupIdToken.type
            } : undefined,
            language2: authorization.idTokenInfo.language2,
            personalMessage: authorization.idTokenInfo.personalMessage
          };

          if (idTokenInfo.status == AuthorizationStatusEnumType.Accepted) {
            if (idTokenInfo.cacheExpiryDateTime &&
              new Date() > new Date(idTokenInfo.cacheExpiryDateTime)) {
              response.idTokenInfo = {
                status: AuthorizationStatusEnumType.Invalid,
                groupIdToken: idTokenInfo.groupIdToken
                // TODO determine how/if to set personalMessage
              }
            } else {
              // If charging station does not have values and evses associated with the component/variable pairs below,
              // this logic will break. CSMS's aiming to use the allowedConnectorTypes or disallowedEvseIdPrefixes
              // Authorization restrictions MUST provide these variable attributes as defined in Physical Component
              // list of Part 2 - Appendices of OCPP 2.0.1
              let evseIds: Set<number> | undefined;
              if (authorization.allowedConnectorTypes) {
                evseIds = new Set();
                const connectorTypes: VariableAttribute[] = await this._deviceModelRepository.readAllByQuery({
                  stationId: message.context.stationId,
                  component_name: 'Connector',
                  variable_name: 'ConnectorType',
                  type: AttributeEnumType.Actual
                });
                for (const connectorType of connectorTypes) {
                  if (authorization.allowedConnectorTypes.indexOf(connectorType.value as string) > 0) {
                    evseIds.add(connectorType.evse?.id as number);
                  }
                }
              }
              if (evseIds && evseIds.size == 0) {
                response.idTokenInfo = {
                  status: AuthorizationStatusEnumType.NotAllowedTypeEVSE,
                  groupIdToken: idTokenInfo.groupIdToken
                  // TODO determine how/if to set personalMessage
                }
              } else {
                // EVSEID prefixes here follow the ISO 15118/IEC 63119-2 format, unlike the evseId list on the
                // IdTokenInfo object which refers to the serial evse ids defined within OCPP 2.0.1's 3-tier model
                // Thus, the EvseId variable of the EVSE component defined in Part 2 - Appendices of OCPP 2.0.1
                // Needs to be looked up to perform the match
                if (authorization.disallowedEvseIdPrefixes) {
                  evseIds = evseIds ? evseIds : new Set();
                  const evseIdAttributes: VariableAttribute[] = await this._deviceModelRepository.readAllByQuery({
                    stationId: message.context.stationId,
                    component_name: 'EVSE',
                    variable_name: 'EvseId',
                    type: AttributeEnumType.Actual
                  });
                  for (const evseIdAttribute of evseIdAttributes) {
                    const evseIdAllowed: boolean = authorization.disallowedEvseIdPrefixes
                      .some(disallowedEvseId => (evseIdAttribute.value as string).startsWith(disallowedEvseId));
                    // If evseId allowed and evseIds were not already filtered by connector type, add to set
                    // If evseId not allowed and evseIds were already filtered by connector type, remove from set
                    if (evseIdAllowed && !authorization.allowedConnectorTypes) {
                      evseIds.add(evseIdAttribute.evse?.id as number);
                    } else if (!evseIdAllowed && authorization.allowedConnectorTypes) {
                      evseIds.delete(evseIdAttribute.evse?.id as number)
                    }
                  }
                }
                if (evseIds && evseIds.size == 0) {
                  response.idTokenInfo = {
                    status: AuthorizationStatusEnumType.NotAtThisLocation,
                    groupIdToken: idTokenInfo.groupIdToken
                    // TODO determine how/if to set personalMessage
                  }
                } else {
                  // TODO: Determine how to check for NotAtThisTime
                  response.idTokenInfo = idTokenInfo;
                  const evseId: number[] = [...(evseIds ? evseIds.values() : [])];
                  if (evseId.length > 0) {
                    response.idTokenInfo.evseId = [evseId.pop() as number, ...evseId];
                  }
                }
              }
            }
          } else {
            // IdTokenInfo.status is one of Blocked, Expired, Invalid, NoCredit
            // N.B. Other statuses should not be allowed to be stored.
            response.idTokenInfo = idTokenInfo;
          }
        } else {
          // Assumed to always be valid without IdTokenInfo
          response.idTokenInfo = {
            status: AuthorizationStatusEnumType.Accepted
            // TODO determine how/if to set personalMessage
          }
        }
      }
      return this.sendCallResultWithMessage(message, response)
    }).then(messageConfirmation => this._logger.debug("Authorize response sent:", messageConfirmation));
  }
}
