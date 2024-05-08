import {IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, } from 'class-validator';
import {TariffDimensionType} from './TariffDimensionType';

export class PriceComponent {
  @IsEnum(TariffDimensionType)
  @IsNotEmpty()
  type!: TariffDimensionType;

  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @IsNumber()
  @IsOptional()
  vat?: number | null;

  @IsInt()
  @IsNotEmpty()
  step_size!: number;
}
