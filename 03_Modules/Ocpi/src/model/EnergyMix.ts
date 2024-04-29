import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EnergySources } from './EnergySources';
import { EnvironmentalImpact } from './EnvironmentalImpact';

export class EnergyMix {
  @IsBoolean()
  @IsNotEmpty()
  is_green_energy!: boolean;

  @IsArray()
  @IsOptional()
  energy_sources?: EnergySources[] | null;

  @IsArray()
  @IsOptional()
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
