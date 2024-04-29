import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Price } from './Price';
import { ChargingPeriod } from './ChargingPeriod';
import { CdrToken } from './CdrToken';
import { AuthMethod } from './AuthMethod';
import { SessionStatus } from './SessionStatus';

export class Session {
  @MaxLength(2)
  @MinLength(2)
  @IsString()
  @IsNotEmpty()
  country_code!: string;

  @MaxLength(3)
  @IsString()
  @IsNotEmpty()
  party_id!: string;

  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  start_date_time!: Date;

  @IsString()
  @IsDateString()
  @IsOptional()
  end_date_time?: Date | null;

  @IsNumber()
  @IsNotEmpty()
  kwh!: number;

  @IsObject()
  @IsNotEmpty()
  cdr_token!: CdrToken;

  @IsString()
  @IsNotEmpty()
  auth_method!: AuthMethod;

  @MaxLength(36)
  @IsString()
  @IsOptional()
  authorization_reference?: string | null;

  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  location_id!: string;

  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  evse_uid!: string;

  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  connector_id!: string;

  @MaxLength(255)
  @IsString()
  @IsOptional()
  meter_id?: string | null;

  @MaxLength(3)
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsArray()
  @IsOptional()
  charging_periods?: ChargingPeriod[] | null;

  @IsOptional()
  total_cost?: Price | null;

  @IsString()
  @IsNotEmpty()
  status!: SessionStatus;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  last_updated!: Date;
}
