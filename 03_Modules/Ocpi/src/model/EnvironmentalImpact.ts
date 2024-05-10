import { IsNotEmpty, IsNumber } from 'class-validator';
import { EnvironmentalImpactCategory } from './EnvironmentalImpactCategory';
import { Enum } from '../util/enum';

export class EnvironmentalImpact {
  @Enum(EnvironmentalImpactCategory, 'EnvironmentalImpactCategory')
  @IsNotEmpty()
  category!: EnvironmentalImpactCategory;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;
}
