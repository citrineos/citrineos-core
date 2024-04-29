import {
  Max,
  Min,
  IsInt,
  IsNotEmpty,
  MaxLength,
  MinLength,
  Matches,
  IsString,
} from 'class-validator';

export class RegularHours {
  @Max(7)
  @Min(1)
  @IsInt()
  @IsNotEmpty()
  weekday!: number;

  @MaxLength(5)
  @MinLength(5)
  @Matches(/([0-1][0-9]|2[0-3]):[0-5][0-9]/)
  @IsString()
  @IsNotEmpty()
  period_begin!: string;

  @MaxLength(5)
  @MinLength(5)
  @Matches(/([0-1][0-9]|2[0-3]):[0-5][0-9]/)
  @IsString()
  @IsNotEmpty()
  period_end!: string;
}
