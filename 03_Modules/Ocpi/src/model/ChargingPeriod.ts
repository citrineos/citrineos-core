import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CdrDimention } from './CdrDimention';
import { Type } from 'class-transformer';
import { Optional } from '../util/decorators/optional';

export class ChargingPeriod {
  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  start_date_time!: Date;

  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  @Type(() => CdrDimention)
  @ValidateNested({ each: true })
  dimensions!: CdrDimention[];

  @MaxLength(36)
  @IsString()
  @Optional()
  tariff_id?: string | null;
}
