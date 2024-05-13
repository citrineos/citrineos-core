import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { EnergySources } from './EnergySources';
import { EnvironmentalImpact } from './EnvironmentalImpact';
import { Type } from 'class-transformer';
import { Optional } from '../util/decorators/optional';

export class EnergyMix {
  @IsBoolean()
  @IsNotEmpty()
  is_green_energy!: boolean;

  @IsArray()
  @Optional()
  @Type(() => EnergySources)
  @ValidateNested({ each: true })
  energy_sources?: EnergySources[] | null;

  @IsArray()
  @Optional()
  @Type(() => EnvironmentalImpact)
  @ValidateNested({ each: true })
  environ_impact?: EnvironmentalImpact[] | null;

  @MaxLength(64)
  @IsString()
  @Optional()
  supplier_name?: string | null;

  @MaxLength(64)
  @IsString()
  @Optional()
  energy_product_name?: string | null;
}
