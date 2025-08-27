import { IBaseDto, ITransactionDto } from '../..';
import { IChargingScheduleDto } from './charging.schedule.dto';

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
  chargingSchedule: IChargingScheduleDto[];
  transactionDatabaseId?: number | null;
  transaction?: ITransactionDto;
}

export enum ChargingProfileDtoProps {
  databaseId = 'databaseId',
  stationId = 'stationId',
  id = 'id',
  chargingProfileKind = 'chargingProfileKind',
  chargingProfilePurpose = 'chargingProfilePurpose',
  recurrencyKind = 'recurrencyKind',
  stackLevel = 'stackLevel',
  validFrom = 'validFrom',
  validTo = 'validTo',
  evseId = 'evseId',
  isActive = 'isActive',
  chargingLimitSource = 'chargingLimitSource',
  chargingSchedule = 'chargingSchedule',
  transactionDatabaseId = 'transactionDatabaseId',
  transaction = 'transaction',
}
