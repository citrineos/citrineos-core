import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PublishTokenType } from './PublishTokenType';
import { AdditionalGeoLocation } from './AdditionalGeoLocation';
import { Businessdetails } from './Businessdetails';
import { Facilities } from './Facilities';
import { Hours } from './Hours';
import { GeoLocation } from './GeoLocation';
import { Evse } from './Evse';
import { EnergyMix } from './EnergyMix';
import { Type } from 'class-transformer';
import { Optional } from '../util/decorators/optional';
import {OcpiResponse} from "../util/ocpi.response";
import {Cdr} from "./Cdr";

export class Location {
  @MaxLength(2)
  @MinLength(2)
  @IsString()
  @IsNotEmpty()
  country_code!: string;

  @MaxLength(3)
  @IsString()
  @IsNotEmpty()
  party_id!: string;

  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsBoolean()
  @IsNotEmpty()
  publish!: boolean;

  @IsArray()
  @Optional()
  @Type(() => PublishTokenType)
  @ValidateNested({ each: true })
  publish_allowed_to?: PublishTokenType[] | null;

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

  @IsArray()
  @Optional()
  @Type(() => AdditionalGeoLocation)
  @ValidateNested({ each: true })
  related_locations?: AdditionalGeoLocation[] | null;

  @IsString()
  @Optional()
  parking_type?: string | null;

  @IsArray()
  @Optional()
  @Type(() => Evse)
  @ValidateNested({ each: true })
  evses?: Evse[] | null;

  @IsArray()
  @Optional()
  directions?: null;

  @Optional()
  @Type(() => Businessdetails)
  @ValidateNested()
  operator?: Businessdetails | null;

  @Optional()
  @Type(() => Businessdetails)
  @ValidateNested()
  suboperator?: Businessdetails | null;

  @Optional()
  owner?: Businessdetails | null;

  @IsArray()
  @Optional()
  // @Type(() => Facilities) todo handle array of enum
  @ValidateNested({ each: true })
  facilities?: Facilities[] | null;

  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  time_zone!: string;

  @Optional()
  @Type(() => Hours)
  @ValidateNested()
  opening_times?: Hours | null;

  @Optional()
  charging_when_closed?: null;

  @IsArray()
  @Optional()
  images?: null;

  @Optional()
  @Type(() => EnergyMix)
  @ValidateNested()
  energy_mix?: EnergyMix | null;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  last_updated!: Date;
}

export class LocationResponse extends OcpiResponse<Location> {
  @IsObject()
  @IsNotEmpty()
  @Type(() => Location)
  @ValidateNested()
  data!: Location;
}

export class LocationListResponse extends OcpiResponse<Location[]> {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Location)
  data!: Location[];
}
