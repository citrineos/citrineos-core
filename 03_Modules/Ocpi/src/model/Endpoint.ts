import {IsEnum, IsNotEmpty, IsString, IsUrl} from "class-validator";
import {ModuleId} from "./ModuleId";
import {InterfaceRole} from "./InterfaceRole";


export class Endpoint {
    @IsString()
    @IsNotEmpty()
    identifier: ModuleId;

    @IsEnum(InterfaceRole)
    @IsNotEmpty()
    role: InterfaceRole;

    @IsString()
    @IsUrl()
    @IsNotEmpty()
    url: string;

}



