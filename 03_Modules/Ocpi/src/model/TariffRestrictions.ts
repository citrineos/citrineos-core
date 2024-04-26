import {IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, Matches, MaxLength, MinLength} from "class-validator";
import {DayOfWeek} from "./DayOfWeek";
import {ReservationRestrictionType} from "./ReservationRestrictionType";


export class TariffRestrictions {
    @MaxLength(5)
    @MinLength(5)
    @Matches(/([0-1][0-9]|2[0-3]):[0-5][0-9]/)
    @IsString()
    @IsOptional()
    start_time?: string | null;

    @MaxLength(5)
    @MinLength(5)
    @Matches(/([0-1][0-9]|2[0-3]):[0-5][0-9]/)
    @IsString()
    @IsOptional()
    end_time?: string | null;

    @MaxLength(10)
    @MinLength(10)
    @Matches(/([12][0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/)
    @IsString()
    @IsOptional()
    start_date?: string | null;

    @MaxLength(10)
    @MinLength(10)
    @Matches(/([12][0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])/)
    @IsString()
    @IsOptional()
    end_date?: string | null;

    @IsNumber()
    @IsOptional()
    min_kwh?: number | null;

    @IsNumber()
    @IsOptional()
    max_kwh?: number | null;

    @IsNumber()
    @IsOptional()
    min_current?: number | null;

    @IsNumber()
    @IsOptional()
    max_current?: number | null;

    @IsNumber()
    @IsOptional()
    min_power?: number | null;

    @IsNumber()
    @IsOptional()
    max_power?: number | null;

    @IsInt()
    @IsOptional()
    min_duration?: number | null;

    @IsInt()
    @IsOptional()
    max_duration?: number | null;

    @IsArray()
    @IsOptional()
    day_of_week?: DayOfWeek[] | null;

    @IsEnum(ReservationRestrictionType)
    @IsOptional()
    reservation?: ReservationRestrictionType | null;

}
