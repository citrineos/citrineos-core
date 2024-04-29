import { IsDate, IsInt, IsOptional } from 'class-validator';

export class FromToOffsetLimitQuerySchema {
  @IsDate()
  @IsOptional()
  date_from?: Date;

  @IsDate()
  @IsOptional()
  date_to?: Date;

  @IsInt()
  @IsOptional()
  offset?: number;

  @IsInt()
  @IsOptional()
  limit?: number;
}
