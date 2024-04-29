import {IsNotEmpty, IsString} from "class-validator";

export class AuthorizationHeaderSchema {
    @IsNotEmpty()
    @IsString()
    Authorization!: string;
}
