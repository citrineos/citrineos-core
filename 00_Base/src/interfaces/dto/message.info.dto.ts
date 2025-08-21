import { IBaseDto, IComponentDto } from '../../index.js';

export interface IMessageInfoDto extends IBaseDto {
  databaseId: number;
  stationId: string;
  id?: number;
  priority: any;
  state?: any;
  startDateTime?: string | null;
  endDateTime?: string | null;
  transactionId?: string | null;
  message: any;
  active: boolean;
  display: IComponentDto;
  displayComponentId?: number | null;
}
