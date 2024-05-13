import { IsInt, IsNotEmpty, ValidateNested } from 'class-validator';
import { Displaytext } from './Displaytext';
import { Type } from 'class-transformer';
import { Optional } from '../util/decorators/optional';
import { Enum } from '../util/decorators/enum';

export enum CommandResponseType {
  ACCEPTED = 'ACCEPTED',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  REJECTED = 'REJECTED',
  UNKNOWN = 'UNKNOWN',
}

export class CommandResponse {
  @Enum(CommandResponseType, 'CommandResponseType')
  @IsNotEmpty()
  result!: CommandResponseType;

  @Optional()
  @Type(() => Displaytext)
  @ValidateNested()
  message?: Displaytext;

  @IsInt()
  timeout!: number;
}
