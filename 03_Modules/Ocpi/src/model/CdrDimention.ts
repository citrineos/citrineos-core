import {IsNotEmpty, IsNumber} from 'class-validator';
import {CdrDimensionType} from './CdrDimensionType';
import {Enum} from "../util/enum";

export class CdrDimention {
  @Enum(CdrDimensionType, 'CdrDimensionType')
  @IsNotEmpty()
  type!: CdrDimensionType;

  @IsNumber()
  @IsNotEmpty()
  volume!: number;
}
