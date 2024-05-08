import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {CdrDimention} from './CdrDimention';
import {Type} from 'class-transformer';

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
  @ValidateNested({each: true})
  dimensions!: CdrDimention[];

  @MaxLength(36)
  @IsString()
  @IsOptional()
  tariff_id?: string | null;
}
