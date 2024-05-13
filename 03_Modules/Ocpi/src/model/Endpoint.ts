import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ModuleId } from './ModuleId';
import { InterfaceRole } from './InterfaceRole';
import { Enum } from '../util/decorators/enum';

export class Endpoint {
  @IsString()
  @IsNotEmpty()
  identifier!: ModuleId;

  @Enum(InterfaceRole, 'InterfaceRole')
  @IsNotEmpty()
  role!: InterfaceRole;

  @IsString()
  @IsUrl()
  @IsNotEmpty()
  url!: string;
}
