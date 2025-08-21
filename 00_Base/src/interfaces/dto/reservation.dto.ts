import { IBaseDto, IEvseTypeDto } from '../../index.js';

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

export enum ReservationDtoProps {
  databaseId = 'databaseId',
  id = 'id',
  stationId = 'stationId',
  expiryDateTime = 'expiryDateTime',
  connectorType = 'connectorType',
  reserveStatus = 'reserveStatus',
  isActive = 'isActive',
  terminatedByTransaction = 'terminatedByTransaction',
  idToken = 'idToken',
  groupIdToken = 'groupIdToken',
  evseId = 'evseId',
  evse = 'evse',
}
