import {
  IsArray,
  IsInt,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { DayOfWeek } from './DayOfWeek';
import { ReservationRestrictionType } from './ReservationRestrictionType';
import { Optional } from '../util/decorators/optional';
import { Enum } from '../util/decorators/enum';

export class TariffRestrictions {
  @MaxLength(5)
  @MinLength(5)
  @Matches(/([0-1][0-9]|2[0-3]):[0-5][0-9]/)
  @IsString()
  @Optional()
  start_time?: string | null;

  @MaxLength(5)
  @MinLength(5)
  @Matches(/([0-1][0-9]|2[0-3]):[0-5][0-9]/)
  @IsString()
  @Optional()
  end_time?: string | null;

  @MaxLength(10)
  @MinLength(10)
  @Matches(/([12][0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/)
  @IsString()
  @Optional()
  start_date?: string | null;

  @MaxLength(10)
  @MinLength(10)
  @Matches(/([12][0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/)
  @IsString()
  @Optional()
  end_date?: string | null;

  @IsNumber()
  @Optional()
  min_kwh?: number | null;

  @IsNumber()
  @Optional()
  max_kwh?: number | null;

  @IsNumber()
  @Optional()
  min_current?: number | null;

  @IsNumber()
  @Optional()
  max_current?: number | null;

  @IsNumber()
  @Optional()
  min_power?: number | null;

  @IsNumber()
  @Optional()
  max_power?: number | null;

  @IsInt()
  @Optional()
  min_duration?: number | null;

  @IsInt()
  @Optional()
  max_duration?: number | null;

  @IsArray()
  @Optional()
  day_of_week?: DayOfWeek[] | null;

  @Enum(ReservationRestrictionType, 'ReservationRestrictionType')
  @Optional()
  reservation?: ReservationRestrictionType | null;
}
