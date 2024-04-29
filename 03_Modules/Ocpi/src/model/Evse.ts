import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EvseStatusSchedule } from './EvseStatusSchedule';
import { Capability } from './Capability';
import { ParkingRestriction } from './ParkingRestriction';
import { EvseStatus } from './EvseStatus';
import { Connector } from './Connector';
import { GeoLocation } from './GeoLocation';
import { Displaytext } from './Displaytext';

export class Evse {
  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  uid!: string;

  @MaxLength(48)
  @IsString()
  @IsOptional()
  evse_id?: string | null;

  @IsEnum(EvseStatus)
  @IsNotEmpty()
  status!: EvseStatus;

  @IsArray()
  @IsOptional()
  status_schedule?: EvseStatusSchedule[] | null;

  @IsArray()
  @IsOptional()
  capabilities?: Capability[] | null;

  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  connectors!: Connector[];

  @MaxLength(4)
  @IsString()
  @IsOptional()
  floor_level?: string | null;

  @IsOptional()
  coordinates?: GeoLocation | null;

  @MaxLength(16)
  @IsString()
  @IsOptional()
  physical_reference?: string | null;

  @IsArray()
  @IsOptional()
  directions?: Displaytext[] | null;

  @IsArray()
  @IsOptional()
  parking_restrictions?: ParkingRestriction[] | null;

  @IsArray()
  @IsOptional()
  images?: null;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  last_updated!: Date;
}
