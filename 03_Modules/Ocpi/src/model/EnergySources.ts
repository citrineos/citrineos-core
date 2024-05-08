import {IsEnum, IsNotEmpty, IsNumber, Max} from 'class-validator';
import {EnergySourceCategory} from './EnergySourceCategory';

export class EnergySources {
  @IsEnum(EnergySourceCategory)
  @IsNotEmpty()
  source!: EnergySourceCategory;

  @Max(100)
  @IsNumber()
  @IsNotEmpty()
  percentage!: number;
}
