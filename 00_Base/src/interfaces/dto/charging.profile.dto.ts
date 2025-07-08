import { IBaseDto, ITransactionDto } from '../..';

export interface IChargingProfileDto extends IBaseDto {
  databaseId: number;
  stationId: string;
  id?: number;
  chargingProfileKind: any;
  chargingProfilePurpose: any;
  recurrencyKind?: any;
  stackLevel: number;
  validFrom?: string | null;
  validTo?: string | null;
  evseId?: number | null;
  isActive: boolean;
  chargingLimitSource?: any;
  chargingSchedule: any[];
  transactionDatabaseId?: number | null;
  transaction?: ITransactionDto;
}
