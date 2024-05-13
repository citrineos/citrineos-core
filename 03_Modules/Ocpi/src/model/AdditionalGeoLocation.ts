import { ValidateNested } from 'class-validator';
import { GeoLocation } from './GeoLocation';
import { Displaytext } from './Displaytext';
import { Type } from 'class-transformer';
import { Optional } from '../util/decorators/optional';

export class AdditionalGeoLocation extends GeoLocation {
  @Optional()
  @Type(() => Displaytext)
  @ValidateNested()
  name?: Displaytext | null;
}
