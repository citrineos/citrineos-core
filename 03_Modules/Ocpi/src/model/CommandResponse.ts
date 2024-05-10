import {IsInt, IsNotEmpty, ValidateNested} from 'class-validator';
import {Displaytext} from './Displaytext';
import {Type} from 'class-transformer';
import {Optional} from "../util/optional";
import {Enum} from "../util/enum";

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
