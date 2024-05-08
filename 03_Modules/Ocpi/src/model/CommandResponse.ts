import {IsEnum, IsInt, IsNotEmpty, IsOptional, ValidateNested} from 'class-validator';
import {Displaytext} from './Displaytext';
import {Type} from 'class-transformer';

export enum CommandResponseType {
  ACCEPTED = 'ACCEPTED',
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  REJECTED = 'REJECTED',
  UNKNOWN = 'UNKNOWN',
}

export class CommandResponse {
  @IsEnum(CommandResponseType)
  @IsNotEmpty()
  result!: CommandResponseType;

  @IsOptional()
  @Type(() => Displaytext)
  @ValidateNested()
  message?: Displaytext;

  @IsInt()
  timeout!: number;
}
