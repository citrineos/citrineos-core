import {VersionNumber} from "./VersionNumber";
import {IsEnum, IsString, IsUrl} from "class-validator";

export class Version {
    @IsEnum(VersionNumber)
    version: VersionNumber;

    @IsString()
    @IsUrl()
    url: string;
}
