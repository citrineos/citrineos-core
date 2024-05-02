import { IsNotEmpty, IsString } from 'class-validator';
import { VersionIdParam } from './version.id.param.schema';

export class LocationIdVersionIdParam extends VersionIdParam {
  @IsString()
  @IsNotEmpty()
  locationID!: string;
}
