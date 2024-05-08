import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {PublishTokenType} from './PublishTokenType';
import {AdditionalGeoLocation} from './AdditionalGeoLocation';
import {Businessdetails} from '../../../../00_Base/src/interfaces/api/ocpi/model/Businessdetails';
import {Facilities} from './Facilities';
import {Hours} from './Hours';
import {GeoLocation} from './GeoLocation';
import {Evse} from './Evse';
import {EnergyMix} from './EnergyMix';
import {Type} from 'class-transformer';

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
  @IsOptional()
  @Type(() => PublishTokenType)
  @ValidateNested({each: true})
  publish_allowed_to?: PublishTokenType[] | null;

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
  @Type(() => GeoLocation)
  @ValidateNested()
  coordinates!: GeoLocation;

  @IsArray()
  @IsOptional()
  @Type(() => AdditionalGeoLocation)
  @ValidateNested({each: true})
  related_locations?: AdditionalGeoLocation[] | null;

  @IsString()
  @IsOptional()
  parking_type?: string | null;

  @IsArray()
  @IsOptional()
  @Type(() => Evse)
  @ValidateNested({each: true})
  evses?: Evse[] | null;

  @IsArray()
  @IsOptional()
  directions?: null;

  @IsOptional()
  @Type(() => Businessdetails)
  @ValidateNested()
  operator?: Businessdetails | null;

  @IsOptional()
  @Type(() => Businessdetails)
  @ValidateNested()
  suboperator?: Businessdetails | null;

  @IsOptional()
  owner?: Businessdetails | null;

  @IsArray()
  @IsOptional()
  @Type(() => Facilities)
  @ValidateNested({each: true})
  facilities?: Facilities[] | null;

  @MaxLength(255)
  @IsString()
  @IsNotEmpty()
  time_zone!: string;

  @IsOptional()
  @Type(() => Hours)
  @ValidateNested()
  opening_times?: Hours | null;

  @IsOptional()
  charging_when_closed?: null;

  @IsArray()
  @IsOptional()
  images?: null;

  @IsOptional()
  @Type(() => EnergyMix)
  @ValidateNested()
  energy_mix?: EnergyMix | null;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  last_updated!: Date;
}
