import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { SignedValue } from './SignedValue';
import { Type } from 'class-transformer';
import { Optional } from '../util/decorators/optional';

export class SignedData {
  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  encoding_method!: string;

  @IsInt()
  @Optional()
  encoding_method_version?: number | null;

  @MaxLength(512)
  @IsString()
  @Optional()
  public_key?: string | null;

  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  @Type(() => SignedValue)
  @ValidateNested({ each: true })
  signed_values!: SignedValue[];

  @MaxLength(512)
  @IsUrl()
  @IsString()
  @Optional()
  url?: string | null;
}
