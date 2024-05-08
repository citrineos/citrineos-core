import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {SignedValue} from './SignedValue';
import {Type} from 'class-transformer';

export class SignedData {
  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  encoding_method!: string;

  @IsInt()
  @IsOptional()
  encoding_method_version?: number | null;

  @MaxLength(512)
  @IsString()
  @IsOptional()
  public_key?: string | null;

  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  @Type(() => SignedValue)
  @ValidateNested({each: true})
  signed_values!: SignedValue[];

  @MaxLength(512)
  @IsUrl()
  @IsString()
  @IsOptional()
  url?: string | null;
}
