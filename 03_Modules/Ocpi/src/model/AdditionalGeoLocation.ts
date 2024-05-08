import {IsOptional, ValidateNested} from 'class-validator';
import {GeoLocation} from './GeoLocation';
import {Displaytext} from './Displaytext';
import {Type} from 'class-transformer';

export class AdditionalGeoLocation extends GeoLocation {
  @IsOptional()
  @Type(() => Displaytext)
  @ValidateNested()
  name?: Displaytext | null;
}
