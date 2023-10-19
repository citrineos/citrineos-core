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
  HandlerProperties,
  ICache,
  IMessage,
  IMessageConfirmation,
  IMessageHandler,
  IMessageSender,
  NotifyReportRequest,
  NotifyReportResponse,
  RegistrationStatusEnumType,
  ReportBaseEnumType,
  ResetEnumType,
  ResetRequest,
  SetVariableDataType,
  SetVariableResultType,
  SetVariableStatusEnumType,
  SetVariablesRequest,
  SetVariablesResponse,
  SystemConfig
} from "@citrineos/base";
import { IBootRepository, IDeviceModelRepository, sequelize } from "@citrineos/data";
import { VariableAttribute } from "@citrineos/data/lib/layers/sequelize";
import { RabbitMqReceiver, RabbitMqSender, Timer } from "@citrineos/util";
import deasyncPromise from "deasync-promise";
import { ILogObj, Logger } from 'tslog';
import { BootService } from "./services";

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
   * When a request to set variables contains more variables than allowed by station's
   * ItemsPerMessageSetVariables variable attribute, they are split up into separate SetVariables
   * requests. The number remaining is kept track of in the cache to mediate behavior that may
   * want to trigger only after all messages are sent, such as when a boot process is Pending.
   */
  static SET_VARIABLES: string = "set_variables";

  /**
   * When multiple SetVariablesRequests are being sent in a row, it is not optimal to reboot
   * immediately. Instead, rebooting is done at the end of said process, if any variable set
   * during the process required it.
   */
  static REBOOT_REQUIRED_FOR_SET_VARIABLES: string = "reboot_required_for_set_variables";

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

  protected _bootService: BootService;

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

    this._bootService = new BootService(this._bootRepository);

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

    /**
     * Workflow:
     * 1. Update device model
     * 2. Construct response
     * 3. Send response
     * 4. Update config
     * 5. If pending, perform configuration
     */

    /**
     * updateDeviceModel(request)
     * response = generateResponse(systemConfig, bootConfig)
     * if accepted, end boot process: undo blacklisting, remove boot status
     * send response
     * update config
     * sendGetMonitoringReport()
     * sendSetVariables()
     * accept boot
     */

    this._logger.debug("BootNotification received:", message, props);

    const stationId = message.context.stationId;
    const tenantId = message.context.tenantId;

    this._deviceModelRepository.updateBootAttributes(message.payload.chargingStation, stationId);

    const bootNotificationResponse: BootNotificationResponse = await this._bootService.generateBootNotificationResponse(stationId, this._config);

    // Check cached boot status for charger. Only Pending and Rejected statuses are cached.
    const cachedBootStatus = await this._cache.get<string>(ProvisioningModule.BOOT_STATUS, stationId);

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
      // N.B. GetMonitoringReport & GetReport will need to un-blacklist NotifyReport
      // N.B. TriggerMessage will need to un-blacklist the message they trigger 
      CALL_SCHEMA_MAP.forEach((actionSchema, action) => {
        if (action !== CallAction.BootNotification) {
          this._cache.set(action, 'blacklisted', stationId)
        }
      });
    }

    const bootNotificationResponseMessageConfirmation: IMessageConfirmation = await this.sendCallResultWithMessage(message, bootNotificationResponse);

    if (bootNotificationResponseMessageConfirmation.success) {
      this._logger.debug("BootNotification response successfully sent to central system: ", bootNotificationResponseMessageConfirmation);
      
      if (!cachedBootStatus || (cachedBootStatus && cachedBootStatus !== bootNotificationResponse.status)) {
        // Cache boot status for charger
        this._cache.set(ProvisioningModule.BOOT_STATUS, bootNotificationResponse.status, stationId);
      }
      // Update charger-specific boot config with details of most recently sent BootNotificationResponse
      const bootConfigDbEntity = await this._bootService.updateBootConfigFromBootNotificationResponse(stationId, bootNotificationResponse);

      // Pending status indicates configuration to do...
      // If boot status was not previously cached or previously cached status was not Pending, start configuration
      // Otherwise, configuration is already in progress.
      if (bootNotificationResponse.status == RegistrationStatusEnumType.Pending &&
        (!cachedBootStatus || cachedBootStatus != RegistrationStatusEnumType.Pending)) {

  
        // Either GetBaseReport or SetVariables or update to Accepted
        const getBaseReportOnPending = (bootConfigDbEntity.getBaseReportOnPending !== null) ? bootConfigDbEntity.getBaseReportOnPending : this._config.provisioning.getBaseReportOnPending;
        if (getBaseReportOnPending) {
          // Remove Notify Report from blacklist
          this._cache.remove(CallAction.NotifyReport, stationId);

          // TODO: Determine if GetBaseReport.requestId needs to be anything special
          const getBaseReportMessageConfirmation: IMessageConfirmation = await this.sendCall(stationId, tenantId, CallAction.GetBaseReport,
            { requestId: 1, reportBase: ReportBaseEnumType.FullInventory } as GetBaseReportRequest);
          if (getBaseReportMessageConfirmation.success) {
            // N.B. The charger will restart this process by sending a BootNotificationRequest in {bootRetryInterval} seconds
            // Make sure GetBaseReport doesn't re-trigger on next boot attempt
            bootConfigDbEntity.getBaseReportOnPending = false;
            await bootConfigDbEntity.save();
            // Ending this boot process
            // Responsibility to wait until NotifyReport messages triggered by GetBaseReport are done being sent
            // before retrying BootNotification is on the charger.
            this._cache.remove(ProvisioningModule.BOOT_STATUS, stationId);
            this._logger.debug("Boot process status cleared: ", cachedBootStatus)
          }
        } else if (bootConfigDbEntity.pendingBootSetVariables && bootConfigDbEntity.pendingBootSetVariables.length > 1) {
          bootConfigDbEntity.variablesRejectedOnLastBoot = [];
          const setVariableData: SetVariableDataType[] = await this._deviceModelRepository.readAllSetVariableByStationId(stationId);

          const itemsPerMessageSetVariablesAttributes: VariableAttribute[] = await this._deviceModelRepository.readAllByQuery({
            stationId: stationId,
            component_name: 'DeviceDataCtrlr',
            variable_name: 'ItemsPerMessage',
            variable_instance: 'SetVariables',
            type: AttributeEnumType.Actual
          })
          // It is possible for itemsPerMessageSetVariablesAttributes.length > 1 if component instances or evses
          // are associated with alternate options. That structure is not supported by this logic, and that
          // structure is a violation of Part 2 - Specification of OCPP 2.0.1.
          // If ItemsPerMessageSetVariables not set, send all variables at once
          const itemsPerMessageSetVariables = itemsPerMessageSetVariablesAttributes.length == 0 ?
            setVariableData.length : Number(itemsPerMessageSetVariablesAttributes[0].value);
          const setVariablesRequests = Math.ceil(setVariableData.length / itemsPerMessageSetVariables);
          this._cache.set(ProvisioningModule.SET_VARIABLES, setVariablesRequests.toString(), stationId);
          while (setVariableData.length > 0) {
            await this.sendCall(stationId, tenantId, CallAction.SetVariables,
              { setVariableData: setVariableData.slice(0, itemsPerMessageSetVariables) } as SetVariablesRequest);
          }
        } else {
          // Update boot config with status accepted
          // TODO: Determine how/if StatusInfo should be generated
          await this._bootRepository.updateStatusByKey(RegistrationStatusEnumType.Accepted, undefined, stationId);
          // We can trigger the new boot immediately rather than wait for the retry, as nothing needs to be done.
          // B02.FR.02 - Spec allows for TriggerMessageRequest - OCTT fails over trigger - removing it here
          // this.sendCall(stationId, tenantId, CallAction.TriggerMessage,
          //   { requestedMessage: MessageTriggerEnumType.BootNotification } as TriggerMessageRequest);
        }
      }
    }

  }

  @AsHandler(CallAction.NotifyReport)
  protected async _handleNotifyReport(
    message: IMessage<NotifyReportRequest>,
    props?: HandlerProperties
  ): Promise<void> {
    this._logger.debug("NotifyReport received:", message, props);

    for (const reportDataType of (message.payload.reportData ? message.payload.reportData : [])) {
      await this._deviceModelRepository.createOrUpdateDeviceModelByStationId(reportDataType, message.context.stationId);
    }

    if (message.payload.tbc !== undefined && !message.payload.tbc) {
      await this._bootRepository.updateStatusByKey(RegistrationStatusEnumType.Accepted, undefined, message.context.stationId);
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
  protected async _handleVariables(
    message: IMessage<SetVariablesResponse>,
    props?: HandlerProperties
  ): Promise<void> {
    this._logger.debug("SetVariables response received", message, props);

    let rebootRequired: boolean = false;
    const rejectedVariables: SetVariableResultType[] = [];
    message.payload.setVariableResult.forEach(setVariableResultType => {
      switch (setVariableResultType.attributeStatus) {
        case SetVariableStatusEnumType.RebootRequired: {
          rebootRequired = true;
          break;
        }
        case SetVariableStatusEnumType.Rejected: {
          rejectedVariables.push(setVariableResultType);
          break;
        }
        default: {
          break;
        }
      }
      // Update VariableAttributes...
      this._deviceModelRepository.updateResultByStationId(setVariableResultType, message.context.stationId);
    });
    // TODO: Determine whether below could trigger race condition...
    const setVariablesRequests = await this._cache.get<string>(ProvisioningModule.SET_VARIABLES, message.context.stationId).then(async setVariablesRequests => {
      if (setVariablesRequests) {
        setVariablesRequests = (Number(setVariablesRequests) - 1).toString();
        await this._cache.set(ProvisioningModule.SET_VARIABLES, setVariablesRequests, message.context.stationId);
      }
      return setVariablesRequests;
    });
    await this._cache.get<string>(ProvisioningModule.BOOT_STATUS, message.context.stationId).then(status => {
      if (status == RegistrationStatusEnumType.Pending) {
        this._bootRepository.readByKey(message.context.stationId).then(bootConfig => {
          if (bootConfig) {
            bootConfig.variablesRejectedOnLastBoot = bootConfig.variablesRejectedOnLastBoot ? bootConfig.variablesRejectedOnLastBoot.concat(rejectedVariables) : rejectedVariables;
            // Update boot config status
            // TODO: Determine how/if StatusInfo should be generated
            if (!this._config.provisioning.bootWithRejectedVariables && rejectedVariables.length > 0) {
              bootConfig.status = RegistrationStatusEnumType.Rejected;
              this._cache.set(ProvisioningModule.BOOT_STATUS, bootConfig.status, message.context.stationId)
            } else if (setVariablesRequests == '0') {
              bootConfig.status = RegistrationStatusEnumType.Accepted;
            }
            return this._bootRepository.createOrUpdateByKey(bootConfig, message.context.stationId);
          }
        });
      }
    });

    if (setVariablesRequests == '0') {
      this._cache.remove(ProvisioningModule.SET_VARIABLES, message.context.stationId);
      const rebootRequiredForSetVariables = await this._cache.get<string>(ProvisioningModule.REBOOT_REQUIRED_FOR_SET_VARIABLES, message.context.stationId);
      if (rebootRequiredForSetVariables || rebootRequired) {
        this._cache.remove(ProvisioningModule.REBOOT_REQUIRED_FOR_SET_VARIABLES, message.context.stationId);
        // Send Reset... 
        this.sendCall(message.context.stationId, message.context.tenantId, CallAction.Reset,
          { type: ResetEnumType.OnIdle } as ResetRequest);
      }
    } else if (rebootRequired) {
      this._cache.set(ProvisioningModule.REBOOT_REQUIRED_FOR_SET_VARIABLES, 'true', message.context.stationId);
    }
  }
}
