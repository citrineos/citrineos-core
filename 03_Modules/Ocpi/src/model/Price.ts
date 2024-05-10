import { IsNotEmpty, IsNumber } from 'class-validator';
import { Optional } from '../util/optional';

export class Price {
  @IsNumber()
  @IsNotEmpty()
  excl_vat!: number;

  @IsNumber()
  @Optional()
  incl_vat?: number | null;
}
