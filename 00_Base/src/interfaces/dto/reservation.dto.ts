import { IBaseDto, IEvseDto } from '../..';
import { IEvseTypeDto } from './evse.type.dto';

export interface IReservationDto extends IBaseDto {
  databaseId: number;
  id?: number;
  stationId: string;
  expiryDateTime: string;
  connectorType?: string | null;
  reserveStatus?: string | null;
  isActive: boolean;
  terminatedByTransaction?: string | null;
  idToken: object;
  groupIdToken?: object | null;
  evseId?: number | null;
  evse?: IEvseTypeDto | null;
}
