import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {Price} from './Price';
import {ChargingPeriod} from './ChargingPeriod';
import {CdrToken} from './CdrToken';
import {AuthMethod} from './AuthMethod';
import {SessionStatus} from './SessionStatus';
import {Type} from 'class-transformer';

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
  @IsOptional()
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

  @IsEnum(AuthMethod)
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
  @Type(() => ChargingPeriod)
  @ValidateNested({each: true})
  charging_periods?: ChargingPeriod[] | null;

  @IsOptional()
  @Type(() => Price)
  @ValidateNested()
  total_cost?: Price | null;

  @IsEnum(SessionStatus)
  @IsNotEmpty()
  status!: SessionStatus;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  last_updated!: Date;
}
