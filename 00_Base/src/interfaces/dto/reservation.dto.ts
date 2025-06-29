import { ConnectorEnumType, IdTokenType, ReserveNowStatusEnumType } from '../../ocpp/model/2.0.1';

export interface IReservationDto {
  databaseId: number;
  id: number;
  stationId: string;
  expiryDateTime: any;
  connectorType: ConnectorEnumType | null;
  reserveStatus: ReserveNowStatusEnumType | null;
  isActive: boolean;
  terminatedByTransaction: string | null;
  idToken: IdTokenType;
  groupIdToken: IdTokenType;
  evseId: number | null;
}
