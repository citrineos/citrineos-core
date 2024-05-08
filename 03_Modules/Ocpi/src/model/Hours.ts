import {IsArray, IsBoolean, IsNotEmpty, IsOptional, ValidateNested} from 'class-validator';
import {RegularHours} from './RegularHours';
import {ExceptionalPeriod} from './ExceptionalPeriod';
import {Type} from 'class-transformer';

export class Hours {
  @IsArray()
  @IsOptional()
  @Type(() => RegularHours)
  @ValidateNested({each: true})
  regular_hours?: RegularHours[] | null;

  @IsBoolean()
  @IsNotEmpty()
  twentyfourseven!: boolean;

  @IsArray()
  @IsOptional()
  @Type(() => ExceptionalPeriod)
  @ValidateNested({each: true})
  exceptional_openings?: ExceptionalPeriod[] | null;

  @IsArray()
  @IsOptional()
  @Type(() => ExceptionalPeriod)
  @ValidateNested({each: true})
  exceptional_closings?: ExceptionalPeriod[] | null;
}
