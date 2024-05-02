import { IsNotEmpty, IsString } from 'class-validator';
import { UidVersionIdParam } from './uid.version.id.param.schema';

export class CommandVersionIdParam extends UidVersionIdParam {
  @IsString()
  @IsNotEmpty()
  command!: string;
}
