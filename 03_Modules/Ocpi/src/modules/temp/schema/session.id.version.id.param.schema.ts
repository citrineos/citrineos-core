import { IsNotEmpty, IsString } from 'class-validator';
import { VersionIdParam } from './version.id.param.schema';

export class SessionIdVersionIdParam extends VersionIdParam {
  @IsString()
  @IsNotEmpty()
  sessionId!: string;
}
