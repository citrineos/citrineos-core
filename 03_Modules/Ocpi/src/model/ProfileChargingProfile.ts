import {
    IsArray,
    IsDateString,
    IsDivisibleBy,
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from "class-validator";
import {ChargingProfilePeriod} from "./ChargingProfilePeriod";


export class ChargingProfile {
    @IsString()
    @IsDateString()
    @IsOptional()
    start_date_time?: Date | null;

    @IsInt()
    @IsOptional()
    duration?: number | null;

    @IsString()
    @IsNotEmpty()
    charging_rate_unit: string;

    @IsDivisibleBy(0.1)
    @IsNumber()
    @IsOptional()
    min_charging_rate?: number | null;

    @IsArray()
    @IsOptional()
    charging_profile_period?: ChargingProfilePeriod[] | null;

}
