import {IsEnum, IsInt, IsNotEmpty, IsOptional} from "class-validator";
import {Displaytext} from "./Displaytext";

export enum CommandResponseType {
    ACCEPTED = 'ACCEPTED',
    NOT_SUPPORTED = 'NOT_SUPPORTED',
    REJECTED = 'REJECTED',
    UNKNOWN = 'UNKNOWN'
}

export class CommandResponse {
    @IsEnum(CommandResponseType)
    @IsNotEmpty()
    result: CommandResponseType;

    @IsOptional()
    message?: Displaytext;

    @IsInt()
    timeout: number;
}
