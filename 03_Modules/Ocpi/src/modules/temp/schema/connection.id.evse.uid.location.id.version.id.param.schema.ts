import { IsNotEmpty, IsString } from 'class-validator';
import { LocationIdEvseUidVersionIdParam } from './location.id.evse.uid.version.id.param.schema';

export class ConnectionIdEvseUidLocationIdVersionIdParam extends LocationIdEvseUidVersionIdParam {
  @IsString()
  @IsNotEmpty()
  connectorID!: string;
}
