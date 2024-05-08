import {IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested,} from 'class-validator';
import {EnergySources} from './EnergySources';
import {EnvironmentalImpact} from './EnvironmentalImpact';
import {Type} from 'class-transformer';

export class EnergyMix {
  @IsBoolean()
  @IsNotEmpty()
  is_green_energy!: boolean;

  @IsArray()
  @IsOptional()
  @Type(() => EnergySources)
  @ValidateNested({each: true})
  energy_sources?: EnergySources[] | null;

  @IsArray()
  @IsOptional()
  @Type(() => EnvironmentalImpact)
  @ValidateNested({each: true})
  environ_impact?: EnvironmentalImpact[] | null;

  @MaxLength(64)
  @IsString()
  @IsOptional()
  supplier_name?: string | null;

  @MaxLength(64)
  @IsString()
  @IsOptional()
  energy_product_name?: string | null;
}
