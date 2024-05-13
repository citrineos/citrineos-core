import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Price } from './Price';
import { ChargingPeriod } from './ChargingPeriod';
import { CdrToken } from './CdrToken';
import { AuthMethod } from './AuthMethod';
import { SessionStatus } from './SessionStatus';
import { Type } from 'class-transformer';
import { Optional } from '../util/decorators/optional';
import { Enum } from '../util/decorators/enum';

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
  @Type(() => Date)
  start_date_time!: Date;

  @IsString()
  @IsDateString()
  @Optional()
  @Type(() => Date)
  end_date_time?: Date | null;

  @IsNumber()
  @IsNotEmpty()
  kwh!: number;

  @IsObject()
  @IsNotEmpty()
  @Type(() => CdrToken)
  @ValidateNested()
  cdr_token!: CdrToken;

  @Enum(AuthMethod, 'AuthMethod')
  @IsNotEmpty()
  auth_method!: AuthMethod;

  @MaxLength(36)
  @IsString()
  @Optional()
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
  @Optional()
  meter_id?: string | null;

  @MaxLength(3)
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsArray()
  @Optional()
  @Type(() => ChargingPeriod)
  @ValidateNested({ each: true })
  charging_periods?: ChargingPeriod[] | null;

  @Optional()
  @Type(() => Price)
  @ValidateNested()
  total_cost?: Price | null;

  @Enum(SessionStatus, 'SessionStatus')
  @IsNotEmpty()
  status!: SessionStatus;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  last_updated!: Date;
}
