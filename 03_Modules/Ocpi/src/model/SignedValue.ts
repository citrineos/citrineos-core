import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SignedValue {
  @MaxLength(32)
  @IsString()
  @IsNotEmpty()
  nature!: string;

  @MaxLength(512)
  @IsString()
  @IsNotEmpty()
  plain_data!: string;

  @MaxLength(5000)
  @IsString()
  @IsNotEmpty()
  signed_data!: string;
}
