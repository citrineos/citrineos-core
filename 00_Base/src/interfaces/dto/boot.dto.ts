import { IBaseDto, IVariableAttributeDto } from '../../index.js';

export interface IBootDto extends IBaseDto {
  id: string;
  lastBootTime?: string | null;
  heartbeatInterval?: number | null;
  bootRetryInterval?: number | null;
  status: any;
  statusInfo?: object | null;
  getBaseReportOnPending?: boolean | null;
  pendingBootSetVariables?: IVariableAttributeDto[];
  variablesRejectedOnLastBoot?: object[] | null;
  bootWithRejectedVariables?: boolean | null;
  changeConfigurationsOnPending?: boolean | null;
  getConfigurationsOnPending?: boolean | null;
}
