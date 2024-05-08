import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
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
  @IsOptional()
  type?: string | null;

  @IsArray()
  @IsOptional()
  @Type(() => Displaytext)
  @ValidateNested({each: true})
  tariff_alt_text?: Displaytext[] | null;

  @IsString()
  @IsUrl()
  @IsOptional()
  tariff_alt_url?: string | null;

  @IsOptional()
  @Type(() => Price)
  @ValidateNested()
  min_price?: Price | null;

  @IsOptional()
  @Type(() => Price)
  @ValidateNested()
  max_price?: Price | null;

  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  @Type(() => TariffElement)
  @ValidateNested({each: true})
  elements!: TariffElement[];

  @IsOptional()
  @Type(() => EnergyMix)
  @ValidateNested()
  energy_mix?: EnergyMix | null;

  @IsString()
  @IsDateString()
  @IsOptional()
  @Type(() => Date)
  start_date_time?: Date | null;

  @IsString()
  @IsDateString()
  @IsOptional()
  @Type(() => Date)
  end_date_time?: Date | null;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  last_updated!: Date;
}
