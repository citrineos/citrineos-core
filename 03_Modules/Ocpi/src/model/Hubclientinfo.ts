import {IsDateString, IsNotEmpty, IsString, MaxLength, MinLength,} from "class-validator";


export class Hubclientinfo {
    @MaxLength(3)
    @IsString()
    @IsNotEmpty()
    party_id: string;

    @MaxLength(2)
    @MinLength(2)
    @IsString()
    @IsNotEmpty()
    country_code: string;

    @IsString()
    @IsNotEmpty()
    role: string;

    @IsString()
    @IsNotEmpty()
    status: string;

    @IsString()
    @IsDateString()
    @IsNotEmpty()
    last_updated: Date;

}
