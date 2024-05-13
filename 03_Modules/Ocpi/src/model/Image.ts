import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  Max,
  MaxLength,
} from 'class-validator';
import { Imagecategory } from './Imagecategory';
import { Optional } from '../util/decorators/optional';
import { Enum } from '../util/decorators/enum';

export class Image {
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsUrl()
  @Optional()
  thumbnail?: string | null;

  @Enum(Imagecategory, 'Imagecategory')
  @IsNotEmpty()
  category!: Imagecategory;

  @MaxLength(4)
  @IsString()
  @IsNotEmpty()
  type!: string;

  @Max(99999)
  @IsInt()
  @Optional()
  width?: number | null;

  @Max(99999)
  @IsInt()
  @Optional()
  height?: number | null;
}
