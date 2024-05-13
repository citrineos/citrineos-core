import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Optional } from '../util/decorators/optional';

export class TokenEnergyContract {
  @MaxLength(64)
  @IsString()
  @IsNotEmpty()
  supplier_name!: string;

  @MaxLength(64)
  @IsString()
  @Optional()
  contract_id?: string | null;
}
