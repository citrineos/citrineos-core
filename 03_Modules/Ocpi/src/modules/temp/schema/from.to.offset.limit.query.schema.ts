import { IsDateString, IsInt } from 'class-validator';
import { Optional } from '../../../util/decorators/optional';

export class FromToOffsetLimitQuery {
  @IsDateString()
  @Optional()
  date_from?: Date;

  @IsDateString()
  @Optional()
  date_to?: Date;

  @IsInt()
  @Optional()
  offset?: number;

  @IsInt()
  @Optional()
  limit?: number;
}
