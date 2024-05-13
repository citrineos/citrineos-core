import {
  IsNotEmpty,
  IsObject,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { GeoLocation } from './GeoLocation';
import { Type } from 'class-transformer';
import { Optional } from '../util/decorators/optional';

export class CdrLocation {
  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  id!: string;

  @MaxLength(255)
  @IsString()
  @Optional()
  name?: string | null;

  @MaxLength(45)
  @IsString()
  @IsNotEmpty()
  address!: string;

  @MaxLength(45)
  @IsString()
  @IsNotEmpty()
  city!: string;

  @MaxLength(10)
  @IsString()
  @Optional()
  postal_code?: string | null;

  @MaxLength(20)
  @IsString()
  @Optional()
  state?: string | null;

  @MaxLength(3)
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsObject()
  @IsNotEmpty()
  @Type(() => GeoLocation)
  @ValidateNested()
  coordinates!: GeoLocation;

  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  evse_uid!: string;

  @MaxLength(48)
  @IsString()
  @IsNotEmpty()
  evse_id!: string;

  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  connector_id!: string;

  @IsString()
  @IsNotEmpty()
  connector_standard!: string;

  @IsString()
  @IsNotEmpty()
  connector_format!: string;

  @IsString()
  @IsNotEmpty()
  connector_power_type!: string;
}
