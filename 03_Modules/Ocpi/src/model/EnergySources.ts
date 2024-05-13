import { IsNotEmpty, IsNumber, Max } from 'class-validator';
import { EnergySourceCategory } from './EnergySourceCategory';
import { Enum } from '../util/decorators/enum';

export class EnergySources {
  @Enum(EnergySourceCategory, 'EnergySourceCategory')
  @IsNotEmpty()
  source!: EnergySourceCategory;

  @Max(100)
  @IsNumber()
  @IsNotEmpty()
  percentage!: number;
}
