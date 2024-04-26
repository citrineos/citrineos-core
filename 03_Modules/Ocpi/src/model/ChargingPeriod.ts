import {ArrayMinSize, IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength,} from "class-validator";
import {CdrDimention} from "./CdrDimention";


export class ChargingPeriod {
    @IsString()
    @IsDateString()
    @IsNotEmpty()
    start_date_time: Date;

    @ArrayMinSize(1)
    @IsArray()
    @IsNotEmpty()
    dimensions: CdrDimention[];

    @MaxLength(36)
    @IsString()
    @IsOptional()
    tariff_id?: string | null;

}
