import {
  ChargingLimitSourceEnumType,
  ChargingProfileKindEnumType,
  ChargingProfilePurposeEnumType,
  RecurrencyKindEnumType,
} from '../../ocpp/model/2.0.1';

export interface IChargingProfileDto {
  databaseId: number;
  id: number;
  stationId: string;
  chargingProfileKind: ChargingProfileKindEnumType;
  chargingProfilePurpose: ChargingProfilePurposeEnumType;
  recurrencyKind?: RecurrencyKindEnumType;
  stackLevel: number;
  validFrom: Date | null;
  validTo: Date | null;
  evseId?: number | null;
  isActive: boolean | null;
  chargingLimitSource: ChargingLimitSourceEnumType | null;
  transactionDatabaseId: number | null;
}
