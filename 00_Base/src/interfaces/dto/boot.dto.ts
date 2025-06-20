import { RegistrationStatusEnumType, SetVariableResultType } from '../../ocpp/model/2.0.1';

export interface IBootDto {
  id: string;
  lastBootTime?: Date;
  heartbeatInterval?: number;
  bootRetryInterval?: number;
  status: RegistrationStatusEnumType;
  // statusInfo?: StatusInfoType; // todo
  getBaseReportOnPending?: boolean;
  variablesRejectedOnLastBoot: SetVariableResultType[];
  bootWithRejectedVariables?: boolean;
}
