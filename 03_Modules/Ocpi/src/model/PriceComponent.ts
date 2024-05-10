import {IsInt, IsNotEmpty, IsNumber,} from 'class-validator';
import {TariffDimensionType} from './TariffDimensionType';
import {Optional} from "../util/optional";
import {Enum} from "../util/enum";

export class PriceComponent {
  @Enum(TariffDimensionType, 'TariffDimensionType')
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
