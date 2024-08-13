import { Boot, IBootRepository } from '@citrineos/data';
import {
  BOOT_STATUS,
  BootConfig,
  BootNotificationResponse,
  CALL_SCHEMA_MAP,
  CallAction,
  GetBaseReportRequest,
  ICache,
  IMessageConfirmation,
  RegistrationStatusEnumType,
  ReportBaseEnumType,
  SystemConfig,
} from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
type Configuration = SystemConfig['modules']['configuration'];

export class BootNotificationService {
  protected _bootRepository: IBootRepository;
  protected _cache: ICache;
  protected _logger: Logger<ILogObj>;
  protected _config: Configuration;
  protected _maxCachingSeconds: number;

  constructor(
    bootRepository: IBootRepository,
    cache: ICache,
    config: Configuration,
    maxCachingSeconds: number,
    logger?: Logger<ILogObj>,
  ) {
    this._bootRepository = bootRepository;
    this._cache = cache;
    this._config = config;
    this._maxCachingSeconds = maxCachingSeconds;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  determineBootStatus(
    bootConfig: Boot | undefined,
  ): RegistrationStatusEnumType {
    let bootStatus = bootConfig
      ? bootConfig.status
      : this._config.unknownChargerStatus;

    if (bootStatus === RegistrationStatusEnumType.Pending) {
      let needToGetBaseReport = this._config.getBaseReportOnPending;
      let needToSetVariables = false;
      if (bootConfig) {
        if (
          bootConfig.getBaseReportOnPending !== undefined &&
          bootConfig.getBaseReportOnPending !== null
        ) {
          needToGetBaseReport = bootConfig.getBaseReportOnPending;
        }
        if (
          bootConfig.pendingBootSetVariables &&
          bootConfig.pendingBootSetVariables.length > 0
        ) {
          needToSetVariables = true;
        }
      }
      if (
        !needToGetBaseReport &&
        !needToSetVariables &&
        this._config.autoAccept
      ) {
        bootStatus = RegistrationStatusEnumType.Accepted;
      }
    }

    return bootStatus;
  }

  async createBootNotificationResponse(
    stationId: string,
  ): Promise<BootNotificationResponse> {
    // Unknown chargers, chargers without a BootConfig, will use SystemConfig.unknownChargerStatus for status.
    const bootConfig = await this._bootRepository.readByKey(stationId);
    const bootStatus = this.determineBootStatus(bootConfig);

    return {
      currentTime: new Date().toISOString(),
      status: bootStatus,
      statusInfo: bootConfig?.statusInfo,
      interval:
        bootStatus === RegistrationStatusEnumType.Accepted
          ? bootConfig?.heartbeatInterval || this._config.heartbeatInterval
          : bootConfig?.bootRetryInterval || this._config.bootRetryInterval,
    };
  }

  async updateBootConfig(
    bootNotificationResponse: BootNotificationResponse,
    stationId: string,
  ): Promise<Boot> {
    let bootConfigDbEntity: Boot | undefined =
      await this._bootRepository.readByKey(stationId);
    if (!bootConfigDbEntity) {
      const unknownChargerBootConfig: BootConfig = {
        status: bootNotificationResponse.status,
        statusInfo: bootNotificationResponse.statusInfo,
      };
      bootConfigDbEntity = await this._bootRepository.createOrUpdateByKey(
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

  async cacheChargerActionsPermissions(
    stationId: string,
    cachedBootStatus: RegistrationStatusEnumType | null,
    bootNotificationResponseStatus: RegistrationStatusEnumType,
  ): Promise<void> {
    // New boot status is Accepted and cachedBootStatus exists (meaning there was a previous Rejected or Pending boot)
    if (
      bootNotificationResponseStatus === RegistrationStatusEnumType.Accepted
    ) {
      if (cachedBootStatus) {
        // Undo blacklisting of charger-originated actions
        const promises = Array.from(CALL_SCHEMA_MAP).map(async ([action]) => {
          if (action !== CallAction.BootNotification) {
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
      const promises = Array.from(CALL_SCHEMA_MAP).map(async ([action]) => {
        if (action !== CallAction.BootNotification) {
          return this._cache.set(action, 'blacklisted', stationId);
        }
      });
      await Promise.all(promises);
    }
  }

  async createGetBaseReportRequest(
    stationId: string,
  ): Promise<GetBaseReportRequest> {
    // Remove Notify Report from blacklist
    await this._cache.remove(CallAction.NotifyReport, stationId);

    // OCTT tool does not meet B07.FR.04; instead always sends requestId === 0
    // Commenting out this line, using requestId === 0 until fixed (10/26/2023)
    // const requestId = Math.floor(Math.random() * ConfigurationModule.GET_BASE_REPORT_REQUEST_ID_MAX);
    const requestId = 0;
    await this._cache.set(
      requestId.toString(),
      'ongoing',
      stationId,
      this._maxCachingSeconds,
    );

    return {
      requestId: requestId,
      reportBase: ReportBaseEnumType.FullInventory,
    } as GetBaseReportRequest;
  }

  async triggerGetBaseReport(
    stationId: string,
    requestId: string,
    getBaseReportMessageConfirmation: IMessageConfirmation,
  ): Promise<void> {
    if (getBaseReportMessageConfirmation.success) {
      this._logger.debug(
        `GetBaseReport successfully sent to charger: ${getBaseReportMessageConfirmation}`,
      );

      // Wait for GetBaseReport to complete
      let getBaseReportCacheValue = await this._cache.onChange(
        requestId,
        this._maxCachingSeconds,
        stationId,
      );
      while (getBaseReportCacheValue === 'ongoing') {
        getBaseReportCacheValue = await this._cache.onChange(
          requestId,
          this._maxCachingSeconds,
          stationId,
        );
      }

      if (getBaseReportCacheValue === 'complete') {
        this._logger.debug('GetBaseReport process successful.'); // All NotifyReports have been processed
      } else {
        throw new Error(
          'GetBaseReport process failed--message timed out without a response.',
        );
      }
    } else {
      throw new Error(
        `GetBaseReport failed: ${JSON.stringify(getBaseReportMessageConfirmation)}`,
      );
    }
  }
}
