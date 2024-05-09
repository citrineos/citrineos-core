import {IsEnum, IsInt, IsNotEmpty, IsNumber,} from 'class-validator';
import {TariffDimensionType} from './TariffDimensionType';
import {Optional} from "../util/optional";

export class PriceComponent {
  @IsEnum(TariffDimensionType)
  @IsNotEmpty()
  type!: TariffDimensionType;

  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @IsNumber()
  @Optional()
  vat?: number | null;

  @IsInt()
  @IsNotEmpty()
  step_size!: number;
}
