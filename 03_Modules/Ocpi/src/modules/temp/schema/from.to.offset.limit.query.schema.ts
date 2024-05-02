import { IsDateString, IsInt, IsOptional } from 'class-validator';

export class FromToOffsetLimitQuery {
  @IsDateString()
  @IsOptional()
  date_from?: Date;

  @IsDateString()
  @IsOptional()
  date_to?: Date;

  @IsInt()
  @IsOptional()
  offset?: number;

  @IsInt()
  @IsOptional()
  limit?: number;
}
