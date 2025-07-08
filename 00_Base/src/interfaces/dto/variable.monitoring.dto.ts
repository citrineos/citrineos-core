import { IBaseDto, IComponentDto, IVariableDto } from '../..';

export interface IVariableMonitoringDto extends IBaseDto {
  databaseId: number;
  id?: number;
  stationId: string;
  transaction: boolean;
  value: number;
  type: any;
  severity: number;
  variable: IVariableDto;
  variableId?: number | null;
  component: IComponentDto;
  componentId?: number | null;
}
