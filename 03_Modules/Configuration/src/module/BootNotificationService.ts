import { Boot, IBootRepository } from '@citrineos/data';
import {
  BootConfig,
  BootNotificationResponse,
  RegistrationStatusEnumType,
  SystemConfig,
} from '@citrineos/base';
type Configuration = SystemConfig['modules']['configuration'];

export class BootNotificationService {
  protected _bootRepository: IBootRepository;

  constructor(bootRepository: IBootRepository) {
    this._bootRepository = bootRepository;
  }

  determineBootStatus(
    bootConfig: Boot | undefined,
    configuration: Configuration,
  ): RegistrationStatusEnumType {
    let bootStatus = bootConfig
      ? bootConfig.status
      : configuration.unknownChargerStatus;

    if (bootStatus === RegistrationStatusEnumType.Pending) {
      let needToGetBaseReport = configuration.getBaseReportOnPending;
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
        configuration.autoAccept
      ) {
        bootStatus = RegistrationStatusEnumType.Accepted;
      }
    }

    return bootStatus;
  }

  createBootNotificationResponse(
    bootConfig: Boot | undefined,
    bootStatus: RegistrationStatusEnumType,
    configuration: Configuration,
  ): BootNotificationResponse {
    return {
      currentTime: new Date().toISOString(),
      status: bootStatus,
      statusInfo: bootConfig?.statusInfo,
      interval:
        bootStatus === RegistrationStatusEnumType.Accepted
          ? bootConfig?.heartbeatInterval || configuration.heartbeatInterval
          : bootConfig?.bootRetryInterval || configuration.bootRetryInterval,
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
}
