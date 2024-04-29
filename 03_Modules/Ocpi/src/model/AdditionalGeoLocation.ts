import { IsOptional } from 'class-validator';
import { GeoLocation } from './GeoLocation';
import { Displaytext } from './Displaytext';

export class AdditionalGeoLocation extends GeoLocation {
  @IsOptional()
  name?: Displaytext | null;
}
