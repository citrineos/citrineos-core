import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CdrToken } from './CdrToken';
import { CdrLocation } from './CdrLocation';
import { ChargingPeriod } from './ChargingPeriod';
import { SignedData } from './SignedData';
import { Price } from './Price';
import { AuthMethod } from './AuthMethod';
import { Tariff } from './Tariff';
import { Type } from 'class-transformer';
import { Optional } from '../util/decorators/optional';
import { Enum } from '../util/decorators/enum';
import { OcpiResponse } from '../util/ocpi.response';

export class Cdr {
  @MaxLength(2)
  @MinLength(2)
  @IsString()
  @IsNotEmpty()
  country_code!: string;

  @MaxLength(3)
  @IsString()
  @IsNotEmpty()
  party_id!: string;

  @MaxLength(39)
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
  @IsNotEmpty()
  @Type(() => Date)
  end_date_time!: Date;

  @MaxLength(36)
  @IsString()
  @Optional()
  session_id?: string | null;

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

  @IsObject()
  @IsNotEmpty()
  @Type(() => CdrLocation)
  @ValidateNested()
  cdr_location!: CdrLocation;

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
  @Type(() => Tariff)
  @ValidateNested({ each: true })
  tariffs?: Tariff[] | null;

  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  @Type(() => ChargingPeriod)
  @ValidateNested({ each: true })
  charging_periods!: ChargingPeriod[];

  @Optional()
  @Type(() => SignedData)
  @ValidateNested()
  signed_data?: SignedData | null;

  @IsNotEmpty()
  @Type(() => Price)
  @ValidateNested()
  total_cost!: Price;

  @Optional()
  @Type(() => Price)
  @ValidateNested()
  total_fixed_cost?: Price | undefined;

  @IsNumber()
  @IsNotEmpty()
  total_energy!: number;

  @Optional()
  @Type(() => Price)
  @ValidateNested()
  total_energy_cost?: Price | null;

  @IsNumber()
  @IsNotEmpty()
  total_time!: number;

  @Optional()
  @Type(() => Price)
  @ValidateNested()
  total_time_cost?: Price | null;

  @IsNumber()
  @Optional()
  total_parking_time?: number | null;

  @Optional()
  @Type(() => Price)
  @ValidateNested()
  total_parking_cost?: Price | null;

  @Optional()
  @Type(() => Price)
  @ValidateNested()
  total_reservation_cost?: Price | null;

  @MaxLength(255)
  @IsString()
  @Optional()
  remark?: string | null;

  @MaxLength(39)
  @IsString()
  @Optional()
  invoice_reference_id?: string | null;

  @Optional()
  @IsBoolean()
  credit?: boolean | null;

  @MaxLength(39)
  @IsString()
  @Optional()
  credit_reference_id?: string | null;

  @Optional()
  @IsBoolean()
  home_charging_compensation?: boolean | null;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  last_updated!: Date;
}

export class CdrResponse extends OcpiResponse<Cdr> {
  @IsObject()
  @IsNotEmpty()
  @Type(() => Cdr)
  @ValidateNested()
  data!: Cdr;
}

export class CdrListResponse extends OcpiResponse<Cdr[]> {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Cdr)
  data!: Cdr[];
}
