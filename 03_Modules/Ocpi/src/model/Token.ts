import {IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength} from "class-validator";
import {TokenEnergyContract} from "./TokenEnergyContract";
import {WhitelistType} from "./WhitelistType";


export class Token {
    @MaxLength(2)
    @MinLength(2)
    @IsString()
    @IsNotEmpty()
    country_code: string;

    @MaxLength(3)
    @IsString()
    @IsNotEmpty()
    party_id: string;

    @MaxLength(36)
    @IsString()
    @IsNotEmpty()
    uid: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @MaxLength(36)
    @IsString()
    @IsNotEmpty()
    contract_id: string;

    @MaxLength(64)
    @IsString()
    @IsOptional()
    visual_number?: string | null;

    @MaxLength(64)
    @IsString()
    @IsNotEmpty()
    issuer: string;

    @MaxLength(36)
    @IsString()
    @IsOptional()
    group_id?: string | null;

    @IsBoolean()
    @IsNotEmpty()
    valid: boolean;

    @IsEnum(WhitelistType)
    @IsNotEmpty()
    whitelist: WhitelistType;

    @MaxLength(2)
    @MinLength(2)
    @IsString()
    @IsOptional()
    language?: string | null;

    @IsString()
    @IsOptional()
    default_profile_type?: string | null;

    @IsOptional()
    energy_contract?: TokenEnergyContract | null;

    @IsString()
    @IsDateString()
    @IsNotEmpty()
    last_updated: Date;

}
