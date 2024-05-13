import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { RegularHours } from './RegularHours';
import { ExceptionalPeriod } from './ExceptionalPeriod';
import { Type } from 'class-transformer';
import { Optional } from '../util/decorators/optional';

export class Hours {
  @IsArray()
  @Optional()
  @Type(() => RegularHours)
  @ValidateNested({ each: true })
  regular_hours?: RegularHours[] | null;

  @IsBoolean()
  @IsNotEmpty()
  twentyfourseven!: boolean;

  @IsArray()
  @Optional()
  @Type(() => ExceptionalPeriod)
  @ValidateNested({ each: true })
  exceptional_openings?: ExceptionalPeriod[] | null;

  @IsArray()
  @Optional()
  @Type(() => ExceptionalPeriod)
  @ValidateNested({ each: true })
  exceptional_closings?: ExceptionalPeriod[] | null;
}
