import { OCPP2_0_1 } from '@citrineos/base';
import { AbstractMapper } from '../AbstractMapper';
import { Boot } from '../../model/Boot';

export class BootMapper extends AbstractMapper {
  id: string;
  lastBootTime?: string | null;
  heartbeatInterval?: number | null;
  bootRetryInterval?: number | null;
  status: OCPP2_0_1.RegistrationStatusEnumType;
  statusInfo?: OCPP2_0_1.StatusInfoType | null;
  getBaseReportOnPending?: boolean | null;
  pendingBootSetVariables?: OCPP2_0_1.VariableAttributeType[] | null;
  variablesRejectedOnLastBoot: OCPP2_0_1.SetVariableResultType[];
  bootWithRejectedVariables?: boolean | null;
  customData?: OCPP2_0_1.CustomDataType | null;

  constructor(boot: Boot) {
    super();
    if (!Object.values(OCPP2_0_1.RegistrationStatusEnumType).includes(boot.status as OCPP2_0_1.RegistrationStatusEnumType)) {
      throw new Error(`Invalid boot status: ${boot.status}`);
    }
    if (!boot.variablesRejectedOnLastBoot) {
      throw new Error('Missing variablesRejectedOnLastBoot');
    }
    this.id = boot.id;
    this.status = boot.status as OCPP2_0_1.RegistrationStatusEnumType;
    this.variablesRejectedOnLastBoot = boot.variablesRejectedOnLastBoot as OCPP2_0_1.SetVariableResultType[];
    this.fromModel(boot);
  }

  toModel(): Boot {
    try {
      return {
        id: this.id,
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
