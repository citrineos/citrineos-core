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
  EventGroup,
  GetBaseReportRequest,
  GetBaseReportResponse,
  GetVariablesResponse,
  HandlerProperties,
  ICache,
  IMessage,
  IMessageConfirmation,
  IMessageHandler,
  IMessageSender,
  MutabilityEnumType,
  NotifyReportRequest,
  NotifyReportResponse,
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
import deasyncPromise from "deasync-promise";
import { ILogObj, Logger } from 'tslog';
import { DeviceModelService } from "./services";
import { Boot } from "@citrineos/data/lib/layers/sequelize";

/**
 * Component that handles provisioning related messages.
 */
export class ProvisioningModule extends AbstractModule {
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
   * Used to wait for SetVariables responses.
   */
  static readonly SET_VARIABLES_RESPONSE_CORRELATION_ID = "set_variables_response_correlation_id";
  /**
   * When multiple SetVariablesRequests are being sent in a row, it is not optimal to reboot
   * immediately. Instead, rebooting is done at the end of said process, if any variable set
   * during the process required it.
   */
  static readonly REBOOT_REQUIRED_FOR_SET_VARIABLES: string = "reboot_required_for_set_variables";

  /**
   * Get Base Report variables. While NotifyReport requests correlated with a GetBaseReport's requestId
   * are still being sent, cache value is 'ongoing'. Once a NotifyReport with tbc == false (or undefined)
   * is received, cache value is 'complete'.
   */
  static readonly GET_BASE_REPORT_REQUEST_ID_MAX = 10000000; // 10,000,000
  static readonly GET_BASE_REPORT_ONGOING_CACHE_VALUE = 'ongoing';
  static readonly GET_BASE_REPORT_COMPLETE_CACHE_VALUE = 'complete';

  /**
   * Fields
   */

  protected _requests: CallAction[] = [
    CallAction.BootNotification,
    CallAction.NotifyReport
  ];

  protected _responses: CallAction[] = [
    CallAction.GetBaseReport,
    CallAction.SetVariables,
    CallAction.GetVariables,
    CallAction.SetNetworkProfile,
    CallAction.Reset
  ];

  public _deviceModelService: DeviceModelService;

  protected _bootRepository: IBootRepository;
  protected _deviceModelRepository: IDeviceModelRepository;

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
   * This is the constructor function that initializes the {@link ProvisioningModule}.
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
    super(config, cache, handler || new RabbitMqReceiver(config, logger), sender || new RabbitMqSender(config, logger), EventGroup.Provisioning, logger);

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
    let bootStatus = bootConfig ? bootConfig.status : this._config.provisioning.unknownChargerStatus;

    // Pending status only stays if there are actions to take for configuration
    if (bootStatus == RegistrationStatusEnumType.Pending) {
      let needToGetBaseReport = this._config.provisioning.getBaseReportOnPending;
      let needToSetVariables = false;
      if (bootConfig) {
        if (bootConfig.getBaseReportOnPending !== undefined && bootConfig.getBaseReportOnPending !== null) {
          needToGetBaseReport = bootConfig.getBaseReportOnPending;
        }
        if (bootConfig.pendingBootSetVariables && bootConfig.pendingBootSetVariables.length > 0) {
          needToSetVariables = true
        }
      }
      if (!needToGetBaseReport && !needToSetVariables) {
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
        (bootConfig?.heartbeatInterval ? bootConfig.heartbeatInterval : this._config.provisioning.heartbeatInterval) :
        // Pending or Rejected == boot retry interval
        (bootConfig?.bootRetryInterval ? bootConfig.bootRetryInterval : this._config.provisioning.bootRetryInterval)
    };

    // Check cached boot status for charger. Only Pending and Rejected statuses are cached.
    const cachedBootStatus = await this._cache.get(ProvisioningModule.BOOT_STATUS, stationId);

    // New boot status is Accepted and cachedBootStatus exists (meaning there was a previous Rejected or Pending boot)
    if (bootNotificationResponse.status == RegistrationStatusEnumType.Accepted && cachedBootStatus) {
      // Undo blacklisting of charger-originated actions
      CALL_SCHEMA_MAP.forEach((actionSchema, action) => {
        this._cache.remove(action, stationId)
      });
      // Remove cached boot status
      this._cache.remove(ProvisioningModule.BOOT_STATUS, stationId);
      this._logger.debug("Cached boot status removed: ", cachedBootStatus);
    } else if (!cachedBootStatus) {
      // Status is not Accepted; i.e. Status is Rejected or Pending.
      // Cached boot status for charger did not exist; i.e. this is the first BootNotificationResponse to be Rejected or Pending.
      // Blacklist all charger-originated actions except BootNotification
      // GetReport messages will need to un-blacklist NotifyReport
      // TriggerMessage will need to un-blacklist the message it triggers 
      CALL_SCHEMA_MAP.forEach((actionSchema, action) => {
        if (action !== CallAction.BootNotification) {
          this._cache.set(action, 'blacklisted', stationId)
        }
      });
    }

    const bootNotificationResponseMessageConfirmation: IMessageConfirmation = await this.sendCallResultWithMessage(message, bootNotificationResponse);

    // Update device model from boot
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
        this._cache.set(ProvisioningModule.BOOT_STATUS, bootNotificationResponse.status, stationId);
      }

      // Pending status indicates configuration to do...
      // If boot status was not previously cached or previously cached status was not Pending, start configuration.
      // Otherwise, configuration is already in progress, do not enter for a second time.
      if (bootNotificationResponse.status == RegistrationStatusEnumType.Pending &&
        (!cachedBootStatus || cachedBootStatus != RegistrationStatusEnumType.Pending)) {
        // TODO Consider refactoring GetBaseReport and SetVariables sections as methods to be used by their respective message api endpoints as well
        // GetBaseReport
        if ((bootConfigDbEntity.getBaseReportOnPending !== null) ? bootConfigDbEntity.getBaseReportOnPending : this._config.provisioning.getBaseReportOnPending) {
          // Remove Notify Report from blacklist
          this._cache.remove(CallAction.NotifyReport, stationId);

          // OCTT tool does not meet B07.FR.04; instead always sends requestId == 0
          // Commenting out this line, using requestId == 0 until fixed (10/26/2023)
          // const requestId = Math.floor(Math.random() * ProvisioningModule.GET_BASE_REPORT_REQUEST_ID_MAX);
          const requestId = 0;
          this._cache.set(requestId.toString(), ProvisioningModule.GET_BASE_REPORT_ONGOING_CACHE_VALUE, stationId, this.config.websocketServer.maxCallLengthSeconds);
          const getBaseReportMessageConfirmation: IMessageConfirmation = await this.sendCall(stationId, tenantId, CallAction.GetBaseReport,
            { requestId: requestId, reportBase: ReportBaseEnumType.FullInventory } as GetBaseReportRequest);
          if (getBaseReportMessageConfirmation.success) {
            this._logger.debug("GetBaseReport successfully sent to charger: ", getBaseReportMessageConfirmation);

            // Wait for GetBaseReport to complete
            let getBaseReportCacheValue = await this._cache.onChange(requestId.toString(), this.config.websocketServer.maxCallLengthSeconds, stationId);
            while (getBaseReportCacheValue == ProvisioningModule.GET_BASE_REPORT_ONGOING_CACHE_VALUE) {
              getBaseReportCacheValue = await this._cache.onChange(requestId.toString(), this.config.websocketServer.maxCallLengthSeconds, stationId);
            }

            if (getBaseReportCacheValue == ProvisioningModule.GET_BASE_REPORT_COMPLETE_CACHE_VALUE) {
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
        if (bootConfigDbEntity.pendingBootSetVariables && bootConfigDbEntity.pendingBootSetVariables.length > 1) {
          bootConfigDbEntity.variablesRejectedOnLastBoot = [];
          let setVariableData: SetVariableDataType[] = await this._deviceModelRepository.readAllSetVariableByStationId(stationId);

          let itemsPerMessageSetVariables = await this._deviceModelService.getItemsPerMessageSetVariablesByStationId(stationId);

          // If ItemsPerMessageSetVariables not set, send all variables at once
          itemsPerMessageSetVariables = itemsPerMessageSetVariables == null ?
            setVariableData.length : itemsPerMessageSetVariables;
          while (setVariableData.length > 0) {
            await this.sendCall(stationId, tenantId, CallAction.SetVariables,
              { setVariableData: setVariableData.slice(0, itemsPerMessageSetVariables) } as SetVariablesRequest);
            setVariableData = setVariableData.slice(itemsPerMessageSetVariables);
            // TODO: Determine how to match request to response. Right now this could trigger on an unrelated SetVariables response being received.
            const setVariableResponseCorrelationId = await this._cache.onChange(ProvisioningModule.SET_VARIABLES_RESPONSE_CORRELATION_ID, this.config.websocketServer.maxCallLengthSeconds, stationId);
            if (setVariableResponseCorrelationId != null) {
              this._logger.debug("SetVariables response correlation id from charger: ", setVariableResponseCorrelationId);
            } else {
              throw new Error("SetVariables response correlation id not found");
            }
          }

          const rejectedSetVariable = await this._deviceModelRepository.existsRejectedSetVariableByStationId(stationId);
          if (rejectedSetVariable && (bootConfigDbEntity.bootWithRejectedVariables !== null) ? !bootConfigDbEntity.bootWithRejectedVariables : !this._config.provisioning.bootWithRejectedVariables) {
            bootConfigDbEntity.status = RegistrationStatusEnumType.Rejected;
            await bootConfigDbEntity.save();
            // No more to do.
            return;
          }
        }
        // Update boot config with status accepted
        // TODO: Determine how/if StatusInfo should be generated
        bootConfigDbEntity.status = RegistrationStatusEnumType.Accepted;
        await bootConfigDbEntity.save();

        if (await this._cache.get<string>(ProvisioningModule.REBOOT_REQUIRED_FOR_SET_VARIABLES, message.context.stationId) == 'true') {
          this._cache.remove(ProvisioningModule.REBOOT_REQUIRED_FOR_SET_VARIABLES, message.context.stationId);
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

  @AsHandler(CallAction.NotifyReport)
  protected async _handleNotifyReport(
    message: IMessage<NotifyReportRequest>,
    props?: HandlerProperties
  ): Promise<void> {
    this._logger.info("NotifyReport received:", message, props);

    if (!message.payload.tbc) { // Default if omitted is false
      const success = await this._cache.set(message.payload.requestId.toString(), ProvisioningModule.GET_BASE_REPORT_COMPLETE_CACHE_VALUE, message.context.stationId);
      this._logger.info("Completed", success, message.payload.requestId);
    } else { // tbc (to be continued) is true
      // Continue to set get base report ongoing. Will extend the timeout.
      const success = await this._cache.set(message.payload.requestId.toString(), ProvisioningModule.GET_BASE_REPORT_ONGOING_CACHE_VALUE, message.context.stationId, this.config.websocketServer.maxCallLengthSeconds);
      this._logger.info("Ongoing", success, message.payload.requestId);
    }

    for (const reportDataType of (message.payload.reportData ? message.payload.reportData : [])) {
      await this._deviceModelRepository.createOrUpdateDeviceModelByStationId(reportDataType, message.context.stationId);
    }

    // Create response
    const response: NotifyReportResponse = {};

    this.sendCallResultWithMessage(message, response)
      .then((messageId) => {
        this._logger.debug("NotifyReport response sent:", messageId);
      });
  }

  /**
   * Handle responses
   */

  @AsHandler(CallAction.GetBaseReport)
  protected _handleBaseReport(
    message: IMessage<GetBaseReportResponse>,
    props?: HandlerProperties
  ): void {
    this._logger.debug("GetBaseReport response received", message, props);
  }

  @AsHandler(CallAction.SetVariables)
  protected async _handleSetVariables(
    message: IMessage<SetVariablesResponse>,
    props?: HandlerProperties
  ): Promise<void> {
    this._logger.debug("SetVariables response received", message, props);

    this._cache.set(ProvisioningModule.SET_VARIABLES_RESPONSE_CORRELATION_ID, message.context.correlationId, message.context.stationId);

    let rebootRequired: boolean = false;
    message.payload.setVariableResult.forEach(setVariableResultType => {
      switch (setVariableResultType.attributeStatus) {
        case SetVariableStatusEnumType.RebootRequired:
          rebootRequired = true;
          break;
        default:
          break;
      }
      // Update VariableAttributes...
      this._deviceModelRepository.updateResultByStationId(setVariableResultType, message.context.stationId);
    });

    if (rebootRequired) { // Determination of whether to reboot immediately must be handled by caller.
      // Expiration of one minute.
      // TODO: Relate groups of SetVariables messages to each other in order to avoid race conditions with this cache value.
      // Return to this TODO once correlationId can be set on messages.
      this._cache.set(ProvisioningModule.REBOOT_REQUIRED_FOR_SET_VARIABLES, 'true', message.context.stationId, 60);
    }
  }

  @AsHandler(CallAction.GetVariables)
  protected async _handleGetVariables(
    message: IMessage<GetVariablesResponse>,
    props?: HandlerProperties
  ): Promise<void> {
    this._logger.debug("GetVariables response received", message, props);
    this._deviceModelRepository.createOrUpdateByGetVariablesResultAndStationId(message.payload.getVariableResult, message.context.stationId);
  }
}
