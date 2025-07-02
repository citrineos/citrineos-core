import { Boot, IBootRepository, OCPP2_0_1_Mapper, OCPP1_6_Mapper } from '@citrineos/data';
import {
  BOOT_STATUS,
  BootConfig,
  ICache,
  IMessageConfirmation,
  OCPP2_0_1,
  OCPP1_6,
  OCPP2_0_1_CALL_SCHEMA_MAP,
  OCPP1_6_CALL_SCHEMA_MAP,
  OCPP2_0_1_CallAction,
  SystemConfig,
  OCPP1_6_CallAction,
} from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';

type Configuration = SystemConfig['modules']['configuration'];

export class BootNotificationService {
  protected _bootRepository: IBootRepository;
  protected _cache: ICache;
  protected _logger: Logger<ILogObj>;
  protected _config: Configuration;

  constructor(
    bootRepository: IBootRepository,
    cache: ICache,
    config: Configuration,
    logger?: Logger<ILogObj>,
  ) {
    this._bootRepository = bootRepository;
    this._cache = cache;
    this._config = config;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  determineBootStatus(bootConfig: Boot | undefined): OCPP2_0_1.RegistrationStatusEnumType {
    let bootStatus = bootConfig
      ? OCPP2_0_1_Mapper.BootMapper.toRegistrationStatusEnumType(bootConfig.status)
      : this._config.ocpp2_0_1!.unknownChargerStatus;

    if (bootStatus === OCPP2_0_1.RegistrationStatusEnumType.Pending) {
      let needToGetBaseReport = this._config.ocpp2_0_1!.getBaseReportOnPending;
      let needToSetVariables = false;
      if (bootConfig) {
        if (
          bootConfig.getBaseReportOnPending !== undefined &&
          bootConfig.getBaseReportOnPending !== null
        ) {
          needToGetBaseReport = bootConfig.getBaseReportOnPending;
        }
        if (bootConfig.pendingBootSetVariables && bootConfig.pendingBootSetVariables.length > 0) {
          needToSetVariables = true;
        }
      }
      if (!needToGetBaseReport && !needToSetVariables && this._config.ocpp2_0_1!.autoAccept) {
        bootStatus = OCPP2_0_1.RegistrationStatusEnumType.Accepted;
      }
    }

    return bootStatus;
  }

  async createBootNotificationResponse(
    tenantId: number,
    stationId: string,
  ): Promise<OCPP2_0_1.BootNotificationResponse> {
    // Unknown chargers, chargers without a BootConfig, will use SystemConfig.unknownChargerStatus for status.
    const bootConfig = await this._bootRepository.readByKey(tenantId, stationId);
    const bootStatus = this.determineBootStatus(bootConfig);

    // When any BootConfig field is not set, the corresponding field on the SystemConfig will be used.
    return {
      currentTime: new Date().toISOString(),
      status: bootStatus,
      statusInfo: OCPP2_0_1_Mapper.BootMapper.toStatusInfo(bootConfig?.statusInfo),
      interval:
        bootStatus === OCPP2_0_1.RegistrationStatusEnumType.Accepted
          ? bootConfig?.heartbeatInterval || this._config.heartbeatInterval
          : bootConfig?.bootRetryInterval || this._config.bootRetryInterval,
    };
  }

  async updateBootConfig(
    bootNotificationResponse: OCPP2_0_1.BootNotificationResponse,
    tenantId: number,
    stationId: string,
  ): Promise<Boot> {
    let bootConfigDbEntity: Boot | undefined = await this._bootRepository.readByKey(
      tenantId,
      stationId,
    );
    if (!bootConfigDbEntity) {
      const unknownChargerBootConfig: BootConfig = {
        status: bootNotificationResponse.status,
        statusInfo: bootNotificationResponse.statusInfo,
      };
      bootConfigDbEntity = await this._bootRepository.createOrUpdateByKey(
        tenantId,
        unknownChargerBootConfig,
        stationId,
      );
    }
    if (!bootConfigDbEntity) {
      throw new Error('Unable to create/update BootConfig...');
    } else {
      bootConfigDbEntity.lastBootTime = bootNotificationResponse.currentTime;
      await bootConfigDbEntity.save();
    }
    return bootConfigDbEntity;
  }

  /**
   * Determines whether to blacklist or whitelist charger actions based on its boot status.
   *
   * If the new boot is accepted and the charger actions were previously blacklisted, then whitelist the charger actions.
   * If the new boot is not accepted and charger actions were previously whitelisted, then blacklist the charger actions.
   *
   * @param stationId
   * @param cachedBootStatus
   * @param bootNotificationResponseStatus
   */
  async cacheChargerActionsPermissions(
    stationId: string,
    cachedBootStatus: OCPP2_0_1.RegistrationStatusEnumType | null,
    bootNotificationResponseStatus: OCPP2_0_1.RegistrationStatusEnumType,
  ): Promise<void> {
    // New boot status is Accepted and cachedBootStatus exists (meaning there was a previous Rejected or Pending boot)
    if (bootNotificationResponseStatus === OCPP2_0_1.RegistrationStatusEnumType.Accepted) {
      if (cachedBootStatus) {
        // Undo blacklisting of charger-originated actions
        const promises = Array.from(OCPP2_0_1_CALL_SCHEMA_MAP).map(async ([action]) => {
          if (action !== OCPP2_0_1_CallAction.BootNotification) {
            return this._cache.remove(action, stationId);
          }
        });
        await Promise.all(promises);
        // Remove cached boot status
        await this._cache.remove(BOOT_STATUS, stationId);
        this._logger.debug('Cached boot status removed: ', cachedBootStatus);
      }
    } else if (!cachedBootStatus) {
      // Status is not Accepted; i.e. Status is Rejected or Pending.
      // Cached boot status for charger did not exist; i.e. this is the first BootNotificationResponse to be Rejected or Pending.
      // Blacklist all charger-originated actions except BootNotification
      // GetReport messages will need to un-blacklist NotifyReport
      // TriggerMessage will need to un-blacklist the message it triggers
      const promises = Array.from(OCPP2_0_1_CALL_SCHEMA_MAP).map(async ([action]) => {
        if (action !== OCPP2_0_1_CallAction.BootNotification) {
          return this._cache.set(action, 'blacklisted', stationId);
        }
      });
      await Promise.all(promises);
    }
  }

  async createGetBaseReportRequest(
    stationId: string,
    maxCachingSeconds: number,
  ): Promise<OCPP2_0_1.GetBaseReportRequest> {
    // OCTT tool does not meet B07.FR.04; instead always sends requestId === 0
    // Commenting out this line, using requestId === 0 until fixed (10/26/2023)
    // const requestId = Math.floor(Math.random() * ConfigurationModule.GET_BASE_REPORT_REQUEST_ID_MAX);
    const requestId = 0;
    await this._cache.set(requestId.toString(), 'ongoing', stationId, maxCachingSeconds);

    return {
      requestId: requestId,
      reportBase: OCPP2_0_1.ReportBaseEnumType.FullInventory,
    } as OCPP2_0_1.GetBaseReportRequest;
  }

  /**
   * Based on the GetBaseReportMessageConfirmation, checks the cache to ensure GetBaseReport truly succeeded.
   * If GetBaseReport did not succeed, this method will throw. Otherwise, it will finish without throwing.
   *
   * @param stationId
   * @param requestId
   * @param getBaseReportMessageConfirmation
   * @param maxCachingSeconds
   */
  async confirmGetBaseReportSuccess(
    stationId: string,
    requestId: string,
    getBaseReportMessageConfirmation: IMessageConfirmation,
    maxCachingSeconds: number,
  ): Promise<void> {
    if (getBaseReportMessageConfirmation.success) {
      this._logger.debug(
        `GetBaseReport successfully sent to charger: ${getBaseReportMessageConfirmation}`,
      );

      // Wait for GetBaseReport to complete
      let getBaseReportCacheValue = await this._cache.onChange(
        requestId,
        maxCachingSeconds,
        stationId,
      );

      while (getBaseReportCacheValue === 'ongoing') {
        getBaseReportCacheValue = await this._cache.onChange(
          requestId,
          maxCachingSeconds,
          stationId,
        );
      }

      if (getBaseReportCacheValue === 'complete') {
        this._logger.debug('GetBaseReport process successful.'); // All NotifyReports have been processed
      } else {
        throw new Error('GetBaseReport process failed--message timed out without a response.');
      }
    } else {
      throw new Error(`GetBaseReport failed: ${JSON.stringify(getBaseReportMessageConfirmation)}`);
    }
  }

  /**
   * Methods for OCPP 1.6
   */

  determineOcpp16BootStatus(
    bootConfig: BootConfig | undefined,
  ): OCPP1_6.BootNotificationResponseStatus {
    let bootStatus = bootConfig
      ? OCPP1_6_Mapper.BootMapper.toRegistrationStatusEnumType(bootConfig.status)
      : this._config.ocpp1_6!.unknownChargerStatus;

    if (bootStatus === OCPP1_6.BootNotificationResponseStatus.Pending) {
      let needToGetConfigurations = true;
      let needToChangeConfigurations = true;
      if (bootConfig) {
        if (
          bootConfig.getConfigurationsOnPending !== undefined &&
          bootConfig.getConfigurationsOnPending !== null
        ) {
          needToGetConfigurations = bootConfig.getConfigurationsOnPending;
        }
        if (
          bootConfig.changeConfigurationsOnPending !== undefined &&
          bootConfig.changeConfigurationsOnPending !== null
        ) {
          needToChangeConfigurations = bootConfig.changeConfigurationsOnPending;
        }
      }
      if (!needToGetConfigurations && !needToChangeConfigurations) {
        bootStatus = OCPP1_6.BootNotificationResponseStatus.Accepted;
      }
    }

    return bootStatus;
  }

  async createOcpp16BootNotificationResponse(
    tenantId: number,
    stationId: string,
  ): Promise<OCPP1_6.BootNotificationResponse> {
    const boot = await this._bootRepository.readByKey(tenantId, stationId);
    const status = this.determineOcpp16BootStatus(boot);

    return {
      currentTime: new Date().toISOString(),
      status,
      interval:
        status === OCPP1_6.BootNotificationResponseStatus.Accepted
          ? boot?.heartbeatInterval || this._config.heartbeatInterval
          : boot?.bootRetryInterval || this._config.bootRetryInterval,
    };
  }

  /**
   * Determines whether to blacklist or whitelist charger actions based on its boot status.
   *
   * If the new boot is accepted and the charger actions were previously blacklisted, then whitelist the charger actions.
   * If the new boot is not accepted and charger actions were previously whitelisted, then blacklist the charger actions.
   *
   * @param stationId
   * @param cachedBootStatus
   * @param bootNotificationResponseStatus
   */
  async cacheOcpp16ChargerActionsPermissions(
    stationId: string,
    cachedBootStatus: OCPP1_6.BootNotificationResponseStatus | null,
    bootNotificationResponseStatus: OCPP1_6.BootNotificationResponseStatus,
  ): Promise<void> {
    // New boot status is Accepted and cachedBootStatus exists (meaning there was a previous Rejected or Pending boot)
    if (bootNotificationResponseStatus === OCPP1_6.BootNotificationResponseStatus.Accepted) {
      if (cachedBootStatus) {
        // Undo blacklisting of charger-originated actions
        const promises = Array.from(OCPP1_6_CALL_SCHEMA_MAP).map(async ([action]) => {
          if (action !== OCPP1_6_CallAction.BootNotification) {
            return this._cache.remove(action, stationId);
          }
        });
        await Promise.all(promises);
        // Remove cached boot status
        await this._cache.remove(BOOT_STATUS, stationId);
        this._logger.debug(
          `Cached boot status ${cachedBootStatus} removed for station ${stationId}.`,
        );
      }
    } else if (!cachedBootStatus) {
      // Status is not Accepted; i.e. Status is Rejected or Pending.
      // Cached boot status for charger did not exist; i.e. this is the first BootNotificationResponse to be Rejected or Pending.
      // Blacklist all charger-originated actions except BootNotification
      // ChangeConfiguration, GetConfiguration and TriggerMessage will need to un-blacklist the message it triggers
      const promises = Array.from(OCPP1_6_CALL_SCHEMA_MAP).map(async ([action]) => {
        if (action !== OCPP1_6_CallAction.BootNotification) {
          return this._cache.set(action, 'blacklisted', stationId);
        }
      });
      await Promise.all(promises);
    }
  }

  async updateOcpp16BootConfig(
    response: OCPP1_6.BootNotificationResponse,
    tenantId: number,
    stationId: string,
  ): Promise<Boot> {
    const heartbeatInterval =
      response.status === OCPP1_6.BootNotificationResponseStatus.Accepted
        ? response.interval
        : undefined;
    const bootRetryInterval =
      response.status !== OCPP1_6.BootNotificationResponseStatus.Accepted
        ? response.interval
        : undefined;

    const unknownChargerBootConfig: BootConfig = {
      status: response.status,
      heartbeatInterval,
      bootRetryInterval,
    };
    let bootConfigDbEntity: Boot | undefined = await this._bootRepository.createOrUpdateByKey(
      tenantId,
      unknownChargerBootConfig,
      stationId,
    );
    if (bootConfigDbEntity) {
      bootConfigDbEntity = await this._bootRepository.updateLastBootTimeByKey(
        tenantId,
        response.currentTime,
        stationId,
      );
    }

    if (!bootConfigDbEntity) {
      throw new Error('Unable to create/update BootConfig...');
    }
    return bootConfigDbEntity;
  }
}
