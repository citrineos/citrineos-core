import { IsArray, IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';
import { RegularHours } from './RegularHours';
import { ExceptionalPeriod } from './ExceptionalPeriod';

export class Hours {
  @IsArray()
  @IsOptional()
  regular_hours?: RegularHours[] | null;

  @IsBoolean()
  @IsNotEmpty()
  twentyfourseven!: boolean;

  @IsArray()
  @IsOptional()
  exceptional_openings?: ExceptionalPeriod[] | null;

  @IsArray()
  @IsOptional()
  exceptional_closings?: ExceptionalPeriod[] | null;
}
