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
  AsHandler,
  AttributeEnumType,
  BootConfig,
  BootNotificationRequest,
  BootNotificationResponse,
  CALL_SCHEMA_MAP,
  CallAction,
  ChangeAvailabilityResponse,
  DataTransferRequest,
  DataTransferResponse,
  DataTransferStatusEnumType,
  EventGroup,
  FirmwareStatusNotificationRequest,
  FirmwareStatusNotificationResponse,
  GetBaseReportRequest,
  HandlerProperties,
  HeartbeatRequest,
  HeartbeatResponse,
  ICache,
  IMessage,
  IMessageConfirmation,
  IMessageHandler,
  IMessageSender,
  MutabilityEnumType,
  RegistrationStatusEnumType,
  ReportBaseEnumType,
  ResetEnumType,
  ResetRequest,
  SetVariableDataType,
  SetVariableStatusEnumType,
  SetVariablesRequest,
  SetVariablesResponse,
  SystemConfig
} from "@citrineos/base";
import { IBootRepository, IDeviceModelRepository, sequelize } from "@citrineos/data";
import { RabbitMqReceiver, RabbitMqSender, Timer } from "@citrineos/util";
import { v4 as uuidv4 } from "uuid";
import deasyncPromise from "deasync-promise";
import { ILogObj, Logger } from 'tslog';
import { Boot } from "@citrineos/data/lib/layers/sequelize/model/Boot";
import { DeviceModelService } from "./services";

/**
 * Component that handles Configuration related messages.
 */
export class ConfigurationModule extends AbstractModule {
  /**
   * Constants used for cache:
   */

  /**
   * Cache boot status is used to keep track of the overall boot process for Rejected or Pending.
   * When Accepting a boot, blacklist needs to be cleared if and only if there was a previously 
   * Rejected or Pending boot. When starting to configure charger, i.e. sending GetBaseReport or
   * SetVariables, this should only be done if configuring is not still ongoing from a previous 
   * BootNotificationRequest. Cache boot status mediates this behavior.
   */
  public static readonly BOOT_STATUS = "boot_status";

  /**
   * Fields
   */

  protected _requests: CallAction[] = [
    CallAction.BootNotification,
    CallAction.Heartbeat
  ];

  protected _responses: CallAction[] = [
    CallAction.GetBaseReport,
    CallAction.SetVariables,
    CallAction.GetVariables,
    CallAction.SetNetworkProfile,
    CallAction.Reset
  ];

  protected _bootRepository: IBootRepository;
  protected _deviceModelRepository: IDeviceModelRepository;

  public _deviceModelService: DeviceModelService;

  get bootRepository(): IBootRepository {
    return this._bootRepository;
  }

  get deviceModelRepository(): IDeviceModelRepository {
    return this._deviceModelRepository;
  }

  /**
   * Constructor
   */


  /**
   * This is the constructor function that initializes the {@link ConfigurationModule}.
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
   * @param {IBootRepository} [bootRepository] - An optional parameter of type {@link IBootRepository} which represents a repository for accessing and manipulating authorization data.
   * If no `bootRepository` is provided, a default {@link sequelize.BootRepository} instance is created and used.
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
    bootRepository?: IBootRepository,
    deviceModelRepository?: IDeviceModelRepository
  ) {
    super(config, cache, handler || new RabbitMqReceiver(config, logger), sender || new RabbitMqSender(config, logger), EventGroup.Configuration, logger);

    const timer = new Timer();
    this._logger.info(`Initializing...`);

    if (!deasyncPromise(this._initHandler(this._requests, this._responses))) {
      throw new Error("Could not initialize module due to failure in handler initialization.");
    }

    this._bootRepository = bootRepository || new sequelize.BootRepository(config, this._logger);
    this._deviceModelRepository = deviceModelRepository || new sequelize.DeviceModelRepository(config, this._logger);

    this._deviceModelService = new DeviceModelService(this._deviceModelRepository);

    this._logger.info(`Initialized in ${timer.end()}ms...`);
  }

  /**
   * Handle requests
   */

  @AsHandler(CallAction.BootNotification)
  protected async _handleBootNotification(
    message: IMessage<BootNotificationRequest>,
    props?: HandlerProperties
  ): Promise<void> {
    this._logger.debug("BootNotification received:", message, props);

    const stationId = message.context.stationId;
    const tenantId = message.context.tenantId;
    const chargingStation = message.payload.chargingStation;


    // Unknown chargers, chargers without a BootConfig, will use SystemConfig.unknownChargerStatus for status.
    const bootConfig = await this._bootRepository.readByKey(stationId)
    let bootStatus = bootConfig ? bootConfig.status : this._config.modules.configuration.unknownChargerStatus;

    // Pending status only stays if there are actions to take for configuration
    if (bootStatus == RegistrationStatusEnumType.Pending) {
      let needToGetBaseReport = this._config.modules.configuration.getBaseReportOnPending;
      let needToSetVariables = false;
      if (bootConfig) {
        if (bootConfig.getBaseReportOnPending !== undefined && bootConfig.getBaseReportOnPending !== null) {
          needToGetBaseReport = bootConfig.getBaseReportOnPending;
        }
        if (bootConfig.pendingBootSetVariables && bootConfig.pendingBootSetVariables.length > 0) {
          needToSetVariables = true
        }
      }
      if (!needToGetBaseReport && !needToSetVariables && this._config.modules.configuration.autoAccept) {
        bootStatus = RegistrationStatusEnumType.Accepted;
      }
    }
    // When any BootConfig field is not set, the corresponding field on the SystemConfig will be used.
    const bootNotificationResponse: BootNotificationResponse = {
      currentTime: new Date().toISOString(),
      status: bootStatus,
      statusInfo: bootConfig?.statusInfo,
      interval: bootStatus == RegistrationStatusEnumType.Accepted ?
        // Accepted == heartbeat interval
        (bootConfig?.heartbeatInterval ? bootConfig.heartbeatInterval : this._config.modules.configuration.heartbeatInterval) :
        // Pending or Rejected == boot retry interval
        (bootConfig?.bootRetryInterval ? bootConfig.bootRetryInterval : this._config.modules.configuration.bootRetryInterval)
    };

    // Check cached boot status for charger. Only Pending and Rejected statuses are cached.
    const cachedBootStatus = await this._cache.get(ConfigurationModule.BOOT_STATUS, stationId);

    // New boot status is Accepted and cachedBootStatus exists (meaning there was a previous Rejected or Pending boot)
    if (bootNotificationResponse.status == RegistrationStatusEnumType.Accepted) {
      if (cachedBootStatus) {
        // Undo blacklisting of charger-originated actions
        const promises = Array.from(CALL_SCHEMA_MAP).map(async ([action]) => {
          if (action !== CallAction.BootNotification) {
            return this._cache.remove(action, stationId);
          }
        });
        await Promise.all(promises);
        // Remove cached boot status
        this._cache.remove(ConfigurationModule.BOOT_STATUS, stationId);
        this._logger.debug("Cached boot status removed: ", cachedBootStatus);
      }
    } else if (!cachedBootStatus) {
      // Status is not Accepted; i.e. Status is Rejected or Pending.
      // Cached boot status for charger did not exist; i.e. this is the first BootNotificationResponse to be Rejected or Pending.
      // Blacklist all charger-originated actions except BootNotification
      // GetReport messages will need to un-blacklist NotifyReport
      // TriggerMessage will need to un-blacklist the message it triggers 
      const promises = Array.from(CALL_SCHEMA_MAP).map(async ([action]) => {
        if (action !== CallAction.BootNotification) {
          return this._cache.set(action, 'blacklisted', stationId);
        }
      });
      await Promise.all(promises);
    }

    const bootNotificationResponseMessageConfirmation: IMessageConfirmation = await this.sendCallResultWithMessage(message, bootNotificationResponse);

    // Update device model from boot
    await this._deviceModelRepository.createOrUpdateDeviceModelByStationId({
      component: {
        name: "ChargingStation"
      },
      variable: {
        name: "Model"
      },
      variableAttribute: [
        {
          type: AttributeEnumType.Actual,
          value: chargingStation.model,
          mutability: MutabilityEnumType.ReadOnly,
          persistent: true,
          constant: true
        }
      ]
    }, stationId);
    await this._deviceModelRepository.createOrUpdateDeviceModelByStationId({
      component: {
        name: "ChargingStation"
      },
      variable: {
        name: "VendorName"
      },
      variableAttribute: [
        {
          type: AttributeEnumType.Actual,
          value: chargingStation.vendorName,
          mutability: MutabilityEnumType.ReadOnly,
          persistent: true,
          constant: true
        }
      ]
    }, stationId);
    if (chargingStation.firmwareVersion) {
      await this._deviceModelRepository.createOrUpdateDeviceModelByStationId({
        component: {
          name: "Controller"
        },
        variable: {
          name: "FirmwareVersion"
        },
        variableAttribute: [
          {
            type: AttributeEnumType.Actual,
            value: chargingStation.firmwareVersion,
            mutability: MutabilityEnumType.ReadOnly,
            persistent: true,
            constant: true
          }
        ]
      }, stationId);
    }
    if (chargingStation.serialNumber) {
      await this._deviceModelRepository.createOrUpdateDeviceModelByStationId({
        component: {
          name: "ChargingStation"
        },
        variable: {
          name: "SerialNumber"
        },
        variableAttribute: [
          {
            type: AttributeEnumType.Actual,
            value: chargingStation.serialNumber,
            mutability: MutabilityEnumType.ReadOnly,
            persistent: true,
            constant: true
          }
        ]
      }, stationId);
    }
    if (chargingStation.modem) {
      if (chargingStation.modem.imsi) {
        await this._deviceModelRepository.createOrUpdateDeviceModelByStationId({
          component: {
            name: "DataLink"
          },
          variable: {
            name: "IMSI"
          },
          variableAttribute: [
            {
              type: AttributeEnumType.Actual,
              value: chargingStation.modem?.imsi,
              mutability: MutabilityEnumType.ReadOnly,
              persistent: true,
              constant: true
            }
          ]
        }, stationId);
      }
      if (chargingStation.modem.iccid) {
        await this._deviceModelRepository.createOrUpdateDeviceModelByStationId({
          component: {
            name: "DataLink"
          },
          variable: {
            name: "ICCID"
          },
          variableAttribute: [
            {
              type: AttributeEnumType.Actual,
              value: chargingStation.modem?.iccid,
              mutability: MutabilityEnumType.ReadOnly,
              persistent: true,
              constant: true
            }
          ]
        }, stationId);
      }
    }
    // Handle post-response actions
    if (bootNotificationResponseMessageConfirmation.success) {
      this._logger.debug("BootNotification response successfully sent to central system: ", bootNotificationResponseMessageConfirmation);

      // Update charger-specific boot config with details of most recently sent BootNotificationResponse
      let bootConfigDbEntity: Boot | undefined = await this._bootRepository.readByKey(stationId);
      if (!bootConfigDbEntity) {
        const unknownChargerBootConfig: BootConfig = {
          status: bootNotificationResponse.status,
          statusInfo: bootNotificationResponse.statusInfo
        }
        bootConfigDbEntity = await this._bootRepository.createOrUpdateByKey(unknownChargerBootConfig, stationId);
      }
      if (!bootConfigDbEntity) {
        throw new Error("Unable to create/update BootConfig...");
      } else {
        bootConfigDbEntity.lastBootTime = bootNotificationResponse.currentTime;
        await bootConfigDbEntity.save();
      }

      if (bootNotificationResponse.status != RegistrationStatusEnumType.Accepted &&
        (!cachedBootStatus || (cachedBootStatus && cachedBootStatus !== bootNotificationResponse.status))) {
        // Cache boot status for charger if (not accepted) and ((not already cached) or (different status from cached status)).
        this._cache.set(ConfigurationModule.BOOT_STATUS, bootNotificationResponse.status, stationId);
      }

      // Pending status indicates configuration to do...
      // If boot status was not previously cached or previously cached status was not Pending, start configuration.
      // Otherwise, configuration is already in progress, do not enter for a second time.
      if (bootNotificationResponse.status == RegistrationStatusEnumType.Pending &&
        (!cachedBootStatus || cachedBootStatus != RegistrationStatusEnumType.Pending)) {
        // TODO Consider refactoring GetBaseReport and SetVariables sections as methods to be used by their respective message api endpoints as well
        // GetBaseReport
        if ((bootConfigDbEntity.getBaseReportOnPending !== null) ? bootConfigDbEntity.getBaseReportOnPending : this._config.modules.configuration.getBaseReportOnPending) {
          // Remove Notify Report from blacklist
          this._cache.remove(CallAction.NotifyReport, stationId);

          // OCTT tool does not meet B07.FR.04; instead always sends requestId == 0
          // Commenting out this line, using requestId == 0 until fixed (10/26/2023)
          // const requestId = Math.floor(Math.random() * ConfigurationModule.GET_BASE_REPORT_REQUEST_ID_MAX);
          const requestId = 0;
          this._cache.set(requestId.toString(), 'ongoing', stationId, this.config.websocket.maxCachingSeconds);
          const getBaseReportMessageConfirmation: IMessageConfirmation = await this.sendCall(stationId, tenantId, CallAction.GetBaseReport,
            { requestId: requestId, reportBase: ReportBaseEnumType.FullInventory } as GetBaseReportRequest);
          if (getBaseReportMessageConfirmation.success) {
            this._logger.debug("GetBaseReport successfully sent to charger: ", getBaseReportMessageConfirmation);

            // Wait for GetBaseReport to complete
            let getBaseReportCacheValue = await this._cache.onChange(requestId.toString(), this.config.websocket.maxCachingSeconds, stationId);
            while (getBaseReportCacheValue == 'ongoing') {
              getBaseReportCacheValue = await this._cache.onChange(requestId.toString(), this.config.websocket.maxCachingSeconds, stationId);
            }

            if (getBaseReportCacheValue == 'complete') {
              this._logger.debug("GetBaseReport process successful."); // All NotifyReports have been processed
            } else { // getBaseReportCacheValue == null
              throw new Error("GetBaseReport process failed--message timed out without a response.");
            }

            // Make sure GetBaseReport doesn't re-trigger on next boot attempt
            bootConfigDbEntity.getBaseReportOnPending = false;
            bootConfigDbEntity.save();
          } else {
            throw new Error("GetBaseReport failed: " + getBaseReportMessageConfirmation);
          }
        }
        // SetVariables
        let rebootSetVariable = false;
        if (bootConfigDbEntity.pendingBootSetVariables && bootConfigDbEntity.pendingBootSetVariables.length > 1) {
          bootConfigDbEntity.variablesRejectedOnLastBoot = [];
          let setVariableData: SetVariableDataType[] = await this._deviceModelRepository.readAllSetVariableByStationId(stationId);

          let itemsPerMessageSetVariables = await this._deviceModelService.getItemsPerMessageSetVariablesByStationId(stationId);

          // If ItemsPerMessageSetVariables not set, send all variables at once
          itemsPerMessageSetVariables = itemsPerMessageSetVariables == null ?
            setVariableData.length : itemsPerMessageSetVariables;
          let rejectedSetVariable = false;
          while (setVariableData.length > 0) {
            // Below pattern is preferred way of receiving CallResults in an async mannner.
            const correlationId = uuidv4();
            const cacheCallbackPromise: Promise<string | null> = this._cache.onChange(correlationId, this.config.websocket.maxCachingSeconds, stationId); // x2 fudge factor for any network lag
            this.sendCall(stationId, tenantId, CallAction.SetVariables,
              { setVariableData: setVariableData.slice(0, itemsPerMessageSetVariables) } as SetVariablesRequest, undefined, correlationId);
            setVariableData = setVariableData.slice(itemsPerMessageSetVariables);
            const responseJsonString = await cacheCallbackPromise;
            if (responseJsonString) {
              const setVariablesResponse: SetVariablesResponse = JSON.parse(responseJsonString);
              setVariablesResponse.setVariableResult.forEach(result => {
                if (result.attributeStatus == SetVariableStatusEnumType.Rejected) {
                  rejectedSetVariable = true;
                } else if (result.attributeStatus == SetVariableStatusEnumType.RebootRequired) {
                  rebootSetVariable = true;
                }
              })
            } else {
              throw new Error("SetVariables response not found");
            }
          }
          if (rejectedSetVariable && (bootConfigDbEntity.bootWithRejectedVariables !== null) ? !bootConfigDbEntity.bootWithRejectedVariables : !this._config.modules.configuration.bootWithRejectedVariables) {
            bootConfigDbEntity.status = RegistrationStatusEnumType.Rejected;
            await bootConfigDbEntity.save();
            // No more to do.
            return;
          }
        }
        if (this._config.modules.configuration.autoAccept) {
          // Update boot config with status accepted
          // TODO: Determine how/if StatusInfo should be generated
          bootConfigDbEntity.status = RegistrationStatusEnumType.Accepted;
          await bootConfigDbEntity.save();
        }
        if (rebootSetVariable) {
          // Charger SHALL not be in a transaction as it has not yet successfully booted, therefore it is appropriate to send an Immediate Reset
          this.sendCall(message.context.stationId, message.context.tenantId, CallAction.Reset,
            { type: ResetEnumType.Immediate } as ResetRequest);
        } else {
          // We could trigger the new boot immediately rather than wait for the retry, as nothing more now needs to be done.
          // However, B02.FR.02 - Spec allows for TriggerMessageRequest - OCTT fails over trigger
          // Commenting out until OCTT behavior changes.
          // this.sendCall(stationId, tenantId, CallAction.TriggerMessage,
          //   { requestedMessage: MessageTriggerEnumType.BootNotification } as TriggerMessageRequest);
        }
      }
    } else {
      throw new Error("BootNotification failed: " + bootNotificationResponseMessageConfirmation);
    }
  }

  @AsHandler(CallAction.Heartbeat)
  protected _handleHeartbeat(
    message: IMessage<HeartbeatRequest>,
    props?: HandlerProperties
  ): void {

    this._logger.debug("Heartbeat received:", message, props);

    // Create response
    const response: HeartbeatResponse = {
      currentTime: new Date().toISOString()
    };

    this.sendCallResultWithMessage(message, response)
      .then(messageConfirmation => this._logger.debug("Heartbeat response sent:", messageConfirmation));
  }


  @AsHandler(CallAction.FirmwareStatusNotification)
  protected _handleFirmwareStatusNotification(
    message: IMessage<FirmwareStatusNotificationRequest>,
    props?: HandlerProperties
  ): void {
    this._logger.debug("FirmwareStatusNotification received:", message, props);

    // TODO: FirmwareStatusNotification is usually triggered. Ideally, it should be sent to the callbackUrl from the message api that sent the trigger message

    // Create response
    const response: FirmwareStatusNotificationResponse = {};

    this.sendCallResultWithMessage(message, response)
      .then(messageConfirmation => this._logger.debug("FirmwareStatusNotification response sent:", messageConfirmation));
  }

  /**
   * Handle responses
   */


  @AsHandler(CallAction.ChangeAvailability)
  protected _handleChangeAvailability(
    message: IMessage<ChangeAvailabilityResponse>,
    props?: HandlerProperties
  ): void {
    this._logger.debug("ChangeAvailability response received:", message, props);
  }

  @AsHandler(CallAction.DataTransfer)
  protected _handleDataTransfer(
    message: IMessage<DataTransferRequest>,
    props?: HandlerProperties
  ): void {
    this._logger.debug("DataTransfer received:", message, props);

    // Create response
    const response: DataTransferResponse = { status: DataTransferStatusEnumType.Rejected };

    this.sendCallResultWithMessage(message, response)
      .then(messageConfirmation => this._logger.debug("DataTransfer response sent:", messageConfirmation));
  }

}
