import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { EvseStatusSchedule } from './EvseStatusSchedule';
import { Capability } from './Capability';
import { ParkingRestriction } from './ParkingRestriction';
import { EvseStatus } from './EvseStatus';
import { Connector } from './Connector';
import { GeoLocation } from './GeoLocation';
import { Displaytext } from './Displaytext';
import { Type } from 'class-transformer';
import { Optional } from '../util/decorators/optional';
import { Enum } from '../util/decorators/enum';

export class Evse {
  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  uid!: string;

  @MaxLength(48)
  @IsString()
  @Optional()
  evse_id?: string | null;

  @Enum(EvseStatus, 'EvseStatus')
  @IsNotEmpty()
  status!: EvseStatus;

  @IsArray()
  @Optional()
  @Type(() => EvseStatusSchedule)
  @ValidateNested({ each: true })
  status_schedule?: EvseStatusSchedule[] | null;

  @IsArray()
  @Optional()
  @Type(() => Capability)
  @ValidateNested({ each: true })
  capabilities?: Capability[] | null;

  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  @Type(() => Connector)
  @ValidateNested({ each: true })
  connectors!: Connector[];

  @MaxLength(4)
  @IsString()
  @Optional()
  floor_level?: string | null;

  @Optional()
  @Type(() => GeoLocation)
  @ValidateNested()
  coordinates?: GeoLocation | null;

  @MaxLength(16)
  @IsString()
  @Optional()
  physical_reference?: string | null;

  @IsArray()
  @Optional()
  @Type(() => Displaytext)
  @ValidateNested()
  directions?: Displaytext[] | null;

  @IsArray()
  @Optional()
  @Type(() => ParkingRestriction)
  @ValidateNested()
  parking_restrictions?: ParkingRestriction[] | null;

  @IsArray()
  @Optional()
  images?: null;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  last_updated!: Date;
}
