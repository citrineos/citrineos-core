import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class TokenEnergyContract {
  @MaxLength(64)
  @IsString()
  @IsNotEmpty()
  supplier_name!: string;

  @MaxLength(64)
  @IsString()
  @IsOptional()
  contract_id?: string | null;
}
