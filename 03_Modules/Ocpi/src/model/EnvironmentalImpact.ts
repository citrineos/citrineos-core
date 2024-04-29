import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { EnvironmentalImpactCategory } from './EnvironmentalImpactCategory';

export class EnvironmentalImpact {
  @IsEnum(EnvironmentalImpactCategory)
  @IsNotEmpty()
  category!: EnvironmentalImpactCategory;

  @IsNumber()
  @IsNotEmpty()
  amount!: number;
}
