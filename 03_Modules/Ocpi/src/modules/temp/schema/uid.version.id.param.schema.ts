import { IsNotEmpty, IsString } from 'class-validator';
import { VersionIdParam } from './version.id.param.schema';

export class UidVersionIdParam {
  @IsString()
  @IsNotEmpty()
  uid!: string;
}
