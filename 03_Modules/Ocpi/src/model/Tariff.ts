import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {Price} from './Price';
import {TariffElement} from './TariffElement';
import {EnergyMix} from './EnergyMix';
import {Displaytext} from './Displaytext';
import {Type} from 'class-transformer';
import {Optional} from '../util/decorators/optional';
import {OcpiResponse} from "../util/ocpi.response";

export class Tariff {
  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  id!: string;

  @MaxLength(2)
  @MinLength(2)
  @IsString()
  @IsNotEmpty()
  country_code!: string;

  @MaxLength(3)
  @IsString()
  @IsNotEmpty()
  party_id!: string;

  @MaxLength(3)
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  currency!: string;

  @IsString()
  @Optional()
  type?: string | null;

  @IsArray()
  @Optional()
  @Type(() => Displaytext)
  @ValidateNested({each: true})
  tariff_alt_text?: Displaytext[] | null;

  @IsString()
  @IsUrl()
  @Optional()
  tariff_alt_url?: string | null;

  @Optional()
  @Type(() => Price)
  @ValidateNested()
  min_price?: Price | null;

  @Optional()
  @Type(() => Price)
  @ValidateNested()
  max_price?: Price | null;

  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  @Type(() => TariffElement)
  @ValidateNested({each: true})
  elements!: TariffElement[];

  @Optional()
  @Type(() => EnergyMix)
  @ValidateNested()
  energy_mix?: EnergyMix | null;

  @IsString()
  @IsDateString()
  @Optional()
  @Type(() => Date)
  start_date_time?: Date | null;

  @IsString()
  @IsDateString()
  @Optional()
  @Type(() => Date)
  end_date_time?: Date | null;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  last_updated!: Date;
}


export class TariffResponse extends OcpiResponse<Tariff> {
  @IsObject()
  @IsNotEmpty()
  @Type(() => Tariff)
  @ValidateNested()
  data!: Tariff;
}

export class TariffListResponse extends OcpiResponse<Tariff[]> {
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => Tariff)
  data!: Tariff[];
}
