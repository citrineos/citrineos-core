import {IsOptional, IsString, MaxLength,} from "class-validator";
import {TokenType} from "./TokenType";


export class PublishTokenType {
    @MaxLength(36)
    @IsString()
    @IsOptional()
    uid?: string | null;

    @IsString()
    @IsOptional()
    type?: TokenType | null;

    @MaxLength(64)
    @IsString()
    @IsOptional()
    visual_number?: string | null;

    @MaxLength(64)
    @IsString()
    @IsOptional()
    issuer?: string | null;

    @MaxLength(36)
    @IsString()
    @IsOptional()
    group_id?: string | null;

}
