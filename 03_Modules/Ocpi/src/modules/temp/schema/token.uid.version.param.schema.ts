import { IsNotEmpty, IsString } from 'class-validator';
import { VersionIdParam } from './version.id.param.schema';

export class TokenUidVersionIdParam extends VersionIdParam {
  @IsString()
  @IsNotEmpty()
  tokenUID!: string;
}
