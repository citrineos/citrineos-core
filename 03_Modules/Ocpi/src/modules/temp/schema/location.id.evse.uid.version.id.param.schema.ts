import { IsNotEmpty, IsString } from 'class-validator';
import { LocationIdVersionIdParam } from './location.id.version.id.param.schema';

export class LocationIdEvseUidVersionIdParam extends LocationIdVersionIdParam {
  @IsString()
  @IsNotEmpty()
  evseUID!: string;
}
