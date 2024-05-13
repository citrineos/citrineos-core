import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';
import { Image } from './Image';
import { Optional } from '../util/decorators/optional';

export class Businessdetails {
  @MaxLength(100)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsUrl()
  @Optional()
  website?: string | null;

  @Optional()
  logo?: Image | null;
}
