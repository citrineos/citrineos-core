import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { GeoLocation } from './GeoLocation';

export class CdrLocation {
  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  id!: string;

  @MaxLength(255)
  @IsString()
  @IsOptional()
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
  @IsOptional()
  postal_code?: string | null;

  @MaxLength(20)
  @IsString()
  @IsOptional()
  state?: string | null;

  @MaxLength(3)
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsObject()
  @IsNotEmpty()
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
