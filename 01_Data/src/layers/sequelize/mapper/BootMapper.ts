import { OCPP2_0_1, OcppRequest, OcppResponse, OCPPVersion, SystemConfig } from '@citrineos/base';
import { Boot } from '../model/Boot';
import { AbstractMapper } from './AbstractMapper';

type Configuration = SystemConfig['modules']['configuration'];

/**
 * Map Boot Model from/to OCPP Requests and Responses
 */
export class BootMapper extends AbstractMapper {
  private readonly _config: Configuration | undefined;

  constructor(ocppVersion: OCPPVersion, config?: Configuration) {
    super(ocppVersion);
    if (config) {
      this._config = config;
    }
  }

  fromRequestToModel(request: OcppRequest): Boot {
    throw new Error('Not implemented');
  }

  fromResponseToModel(response: OcppResponse): Boot {
    throw new Error('Not implemented');
  }

  fromModelToRequest(boot: Boot): OcppRequest {
    throw new Error('Not implemented');
  }

  fromModelToResponse(boot: Boot): OcppResponse {
    if (this._ocppVersion === OCPPVersion.OCPP1_6) {
      throw new Error('Not implemented');
    } else {
      return this.toOcpp201Response(boot);
    }
  }

  private toOcpp201Response(boot: Boot): OCPP2_0_1.BootNotificationResponse {
    if (this._config == null) {
      throw new Error(`Configuration is not set for boot ${boot.id}`);
    }
    let bootStatus = this.determineOcpp201BootStatus(boot, this._config);
    let statusInfo = boot?.statusInfo ? (boot.statusInfo as OCPP2_0_1.StatusInfoType) : undefined;

    return {
      currentTime: new Date().toISOString(),
      status: bootStatus,
      statusInfo: statusInfo,
      interval: bootStatus === OCPP2_0_1.RegistrationStatusEnumType.Accepted ? boot?.heartbeatInterval || this._config.heartbeatInterval : boot?.bootRetryInterval || this._config.bootRetryInterval,
    };
  }

  private determineOcpp201BootStatus(boot: Boot, config: Configuration): OCPP2_0_1.RegistrationStatusEnumType {
    let bootStatus = config.unknownChargerStatus;
    if (boot?.status && Object.values(OCPP2_0_1.RegistrationStatusEnumType).some((status) => status === boot.status)) {
      bootStatus = <OCPP2_0_1.RegistrationStatusEnumType>boot.status;
    }

    if (bootStatus === OCPP2_0_1.RegistrationStatusEnumType.Pending) {
      let needToGetBaseReport = config.getBaseReportOnPending;
      let needToSetVariables = false;
      if (boot.getBaseReportOnPending !== undefined && boot.getBaseReportOnPending !== null) {
        needToGetBaseReport = boot.getBaseReportOnPending;
      }
      if (boot.pendingBootSetVariables && boot.pendingBootSetVariables.length > 0) {
        needToSetVariables = true;
      }
      if (!needToGetBaseReport && !needToSetVariables && config.autoAccept) {
        bootStatus = OCPP2_0_1.RegistrationStatusEnumType.Accepted;
      }
    }

    return bootStatus;
  }
}
