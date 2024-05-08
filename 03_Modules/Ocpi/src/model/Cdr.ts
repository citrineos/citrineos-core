import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
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
import {CdrToken} from './CdrToken';
import {CdrLocation} from './CdrLocation';
import {ChargingPeriod} from './ChargingPeriod';
import {SignedData} from './SignedData';
import {Price} from './Price';
import {AuthMethod} from './AuthMethod';
import {Tariff} from './Tariff';
import {Type} from 'class-transformer';
import {OcpiResponse} from "@citrineos/base";
import {JSONSchema} from "../util/class.validator";

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
  @IsOptional()
  session_id?: string | null;

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

  @IsObject()
  @IsNotEmpty()
  @Type(() => CdrLocation)
  @ValidateNested()
  cdr_location!: CdrLocation;

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
  @Type(() => Tariff)
  @ValidateNested({each: true})
  tariffs?: Tariff[] | null;

  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  @Type(() => ChargingPeriod)
  @ValidateNested({each: true})
  charging_periods!: ChargingPeriod[];

  @IsOptional()
  @Type(() => SignedData)
  @ValidateNested()
  signed_data?: SignedData | null;

  @IsNotEmpty()
  @Type(() => Price)
  @ValidateNested()
  total_cost!: Price;

  @IsOptional()
  @Type(() => Price)
  @ValidateNested()
  total_fixed_cost?: Price | null;

  @IsNumber()
  @IsNotEmpty()
  total_energy!: number;

  @IsOptional()
  @Type(() => Price)
  @ValidateNested()
  total_energy_cost?: Price | null;

  @IsNumber()
  @IsNotEmpty()
  total_time!: number;

  @IsOptional()
  @Type(() => Price)
  @ValidateNested()
  total_time_cost?: Price | null;

  @IsNumber()
  @IsOptional()
  total_parking_time?: number | null;

  @IsOptional()
  @Type(() => Price)
  @ValidateNested()
  total_parking_cost?: Price | null;

  @IsOptional()
  @Type(() => Price)
  @ValidateNested()
  total_reservation_cost?: Price | null;

  @MaxLength(255)
  @IsString()
  @IsOptional()
  remark?: string | null;

  @MaxLength(39)
  @IsString()
  @IsOptional()
  invoice_reference_id?: string | null;

  @IsOptional()
  @IsBoolean()
  credit?: boolean | null;

  @MaxLength(39)
  @IsString()
  @IsOptional()
  credit_reference_id?: string | null;

  @IsOptional()
  @IsBoolean()
  home_charging_compensation?: boolean | null;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  last_updated!: Date;
}

// ts-ignore
// export class CdrListResponse extends OcpiDataResponse<OcpiResponse<Array<Cdr>>, Array<Cdr>> {}

// export class CdrList extends Array<Cdr> {
// }
//
// export const CdrListResponse = createOcpiResponseList(CdrList, Cdr);

export class CdrResponse extends OcpiResponse<Cdr> {
  @IsObject()
  @IsNotEmpty()
  @Type(() => Cdr)
  @ValidateNested()
  data!: Cdr;
}

export class CdrListResponse extends OcpiResponse<Cdr[]> {
  @JSONSchema({
    type: 'array',
    items: {
      $ref: '#/components/schemas/Cdr',
    }
  })
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => Cdr)
  data!: Cdr[];
}
