import { Boot, IBootRepository, BootMapper } from '@citrineos/data';
import {
  BOOT_STATUS,
  BootConfig,
  ICache,
  IMessageConfirmation,
  OCPP2_0_1,
  OCPP2_0_1_CALL_SCHEMA_MAP,
  OCPP2_0_1_CallAction,
  OCPPVersion,
  SystemConfig,
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

  determineBootStatus(): OCPP2_0_1.RegistrationStatusEnumType {
    let bootStatus = this._config.unknownChargerStatus;

    if (bootStatus === OCPP2_0_1.RegistrationStatusEnumType.Pending) {
      let needToGetBaseReport = this._config.getBaseReportOnPending;
      if (!needToGetBaseReport && this._config.autoAccept) {
        bootStatus = OCPP2_0_1.RegistrationStatusEnumType.Accepted;
      }
    }

    return bootStatus;
  }

  async createBootNotificationResponse(
    stationId: string,
  ): Promise<OCPP2_0_1.BootNotificationResponse> {
    // Unknown chargers, chargers without a BootConfig, will use SystemConfig.unknownChargerStatus for status.
    const bootConfig = await this._bootRepository.readByKey(stationId);
    this._logger.debug(`Found boot config: ${JSON.stringify(bootConfig)}`);
    if (bootConfig) {
      const bootMapper = new BootMapper(OCPPVersion.OCPP2_0_1, this._config);
      return bootMapper.fromModelToResponse(
        bootConfig,
      ) as OCPP2_0_1.BootNotificationResponse;
    } else {
      const bootStatus = this.determineBootStatus();
      // When any BootConfig field is not set, the corresponding field on the SystemConfig will be used.
      return {
        currentTime: new Date().toISOString(),
        status: bootStatus,
        interval:
          bootStatus === OCPP2_0_1.RegistrationStatusEnumType.Accepted
            ? this._config.heartbeatInterval
            : this._config.bootRetryInterval,
      };
    }
  }

  async updateBootConfig(
    bootNotificationResponse: OCPP2_0_1.BootNotificationResponse,
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
    if (
      bootNotificationResponseStatus ===
      OCPP2_0_1.RegistrationStatusEnumType.Accepted
    ) {
      if (cachedBootStatus) {
        // Undo blacklisting of charger-originated actions
        const promises = Array.from(OCPP2_0_1_CALL_SCHEMA_MAP).map(
          async ([action]) => {
            if (action !== OCPP2_0_1_CallAction.BootNotification) {
              return this._cache.remove(action, stationId);
            }
          },
        );
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
      const promises = Array.from(OCPP2_0_1_CALL_SCHEMA_MAP).map(
        async ([action]) => {
          if (action !== OCPP2_0_1_CallAction.BootNotification) {
            return this._cache.set(action, 'blacklisted', stationId);
          }
        },
      );
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
    await this._cache.set(
      requestId.toString(),
      'ongoing',
      stationId,
      maxCachingSeconds,
    );

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
