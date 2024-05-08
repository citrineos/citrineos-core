import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {EvseStatusSchedule} from './EvseStatusSchedule';
import {Capability} from './Capability';
import {ParkingRestriction} from './ParkingRestriction';
import {EvseStatus} from './EvseStatus';
import {Connector} from './Connector';
import {GeoLocation} from './GeoLocation';
import {Displaytext} from './Displaytext';
import {Type} from 'class-transformer';

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
  @Type(() => EvseStatusSchedule)
  @ValidateNested({each: true})
  status_schedule?: EvseStatusSchedule[] | null;

  @IsArray()
  @IsOptional()
  @Type(() => Capability)
  @ValidateNested({each: true})
  capabilities?: Capability[] | null;

  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  @Type(() => Connector)
  @ValidateNested({each: true})
  connectors!: Connector[];

  @MaxLength(4)
  @IsString()
  @IsOptional()
  floor_level?: string | null;

  @IsOptional()
  @Type(() => GeoLocation)
  @ValidateNested()
  coordinates?: GeoLocation | null;

  @MaxLength(16)
  @IsString()
  @IsOptional()
  physical_reference?: string | null;

  @IsArray()
  @IsOptional()
  @Type(() => Displaytext)
  @ValidateNested()
  directions?: Displaytext[] | null;

  @IsArray()
  @IsOptional()
  @Type(() => ParkingRestriction)
  @ValidateNested()
  parking_restrictions?: ParkingRestriction[] | null;

  @IsArray()
  @IsOptional()
  images?: null;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  last_updated!: Date;
}
