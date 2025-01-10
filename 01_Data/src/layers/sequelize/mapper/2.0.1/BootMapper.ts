import { OCPP2_0_1 } from '@citrineos/base';
import { AbstractMapper } from '../AbstractMapper';
import { Boot } from '../../model/Boot';

export class BootMapper extends AbstractMapper {
  lastBootTime?: string;
  heartbeatInterval?: number;
  bootRetryInterval?: number;
  status: OCPP2_0_1.RegistrationStatusEnumType;
  statusInfo?: OCPP2_0_1.StatusInfoType;
  getBaseReportOnPending?: boolean;
  pendingBootSetVariables?: OCPP2_0_1.VariableAttributeType[];
  variablesRejectedOnLastBoot: OCPP2_0_1.SetVariableResultType[];
  bootWithRejectedVariables?: boolean;
  customData?: OCPP2_0_1.CustomDataType;

  constructor(boot: Boot) {
    super();
    try {
      this.status = boot.status as OCPP2_0_1.RegistrationStatusEnumType;
      this.variablesRejectedOnLastBoot = boot.variablesRejectedOnLastBoot as OCPP2_0_1.SetVariableResultType[];
      this.fromModel(boot);
    } catch (error) {
      throw new Error(`Generate BootMapper from Boot failed: ${error}`);
    }
  }

  toModel(): Boot {
    try {
      return {
        lastBootTime: this.lastBootTime,
        heartbeatInterval: this.heartbeatInterval,
        bootRetryInterval: this.bootRetryInterval,
        status: this.status,
        statusInfo: this.statusInfo,
        getBaseReportOnPending: this.getBaseReportOnPending,
        pendingBootSetVariables: this.pendingBootSetVariables,
        variablesRejectedOnLastBoot: this.variablesRejectedOnLastBoot,
        bootWithRejectedVariables: this.bootWithRejectedVariables,
        customData: this.customData,
      } as Boot;
    } catch (error) {
      throw new Error('Convert BootMapper to Boot failed: ' + error);
    }
  }

  private fromModel(boot: Boot): void {
    this.lastBootTime = boot.lastBootTime ? boot.lastBootTime : undefined;
    this.heartbeatInterval = boot.heartbeatInterval;
    this.bootRetryInterval = boot.bootRetryInterval;
    this.statusInfo = boot.statusInfo != null ? (boot.statusInfo as OCPP2_0_1.StatusInfoType) : undefined;
    this.getBaseReportOnPending = boot.getBaseReportOnPending;
    this.pendingBootSetVariables = boot.pendingBootSetVariables ? (boot.pendingBootSetVariables as OCPP2_0_1.VariableAttributeType[]) : undefined;
    this.bootWithRejectedVariables = boot.bootWithRejectedVariables;
    this.customData = boot.customData != null ? (boot.customData as OCPP2_0_1.CustomDataType) : undefined;
  }
}
