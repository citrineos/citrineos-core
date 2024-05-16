import {IsNotEmpty, ValidateNested} from 'class-validator';
import {Displaytext} from './Displaytext';
import {Type} from 'class-transformer';
import {Optional} from '../util/decorators/optional';
import {Enum} from '../util/decorators/enum';
import {OcpiResponse} from "../util/ocpi.response";

export enum CommandResponseType {
  ACCEPTED = 'ACCEPTED',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  REJECTED = 'REJECTED',
  UNKNOWN = 'UNKNOWN',
}

export class CommandResult {
  @Enum(CommandResponseType, 'CommandResponseType')
  @IsNotEmpty()
  result!: CommandResponseType;

  @Optional()
  @Type(() => Displaytext)
  @ValidateNested()
  message?: Displaytext;
}

export class OcpiCommandResponse extends OcpiResponse<CommandResult> {
  @IsNotEmpty()
  @Type(() => CommandResult)
  @ValidateNested()
  data!: CommandResult;
}
