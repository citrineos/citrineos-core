import { MonitorEnumType } from '../../ocpp/model/2.0.1';

export interface IVariableMonitoring {
  databaseId: number;
  id: number;
  stationId: string;
  transaction: boolean;
  value: number;
  type: MonitorEnumType;
  severity: number;
  variableId?: number | null;
  componentId?: number | null;
}
