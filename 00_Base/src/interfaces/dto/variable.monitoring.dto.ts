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

export enum VariableMonitoringDtoProps {
  databaseId = 'databaseId',
  id = 'id',
  stationId = 'stationId',
  transaction = 'transaction',
  value = 'value',
  type = 'type',
  severity = 'severity',
  variable = 'variable',
  variableId = 'variableId',
  component = 'component',
  componentId = 'componentId',
}
