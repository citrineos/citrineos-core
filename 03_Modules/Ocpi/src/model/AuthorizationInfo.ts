import {LocationReferences} from "./LocationReferences";
import {Displaytext} from "./Displaytext";
import {Token} from "./Token";
import {AuthorizationInfoAllowed} from "./AuthorizationInfoAllowed";
import {IsEnum, IsNotEmpty, IsOptional, IsString} from "class-validator";

export class AuthorizationInfo {
    @IsEnum(AuthorizationInfoAllowed)
    allowed: AuthorizationInfoAllowed;

    @IsNotEmpty()
    token: Token;

    @IsString
    authorizationReference: string;

    @IsOptional()
    info?: Displaytext;

    @IsOptional()
    location?: LocationReferences;
}
