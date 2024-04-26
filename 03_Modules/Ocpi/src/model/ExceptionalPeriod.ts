import {IsDateString, IsNotEmpty, IsString,} from "class-validator";


export class ExceptionalPeriod {
    @IsString()
    @IsDateString()
    @IsNotEmpty()
    period_begin: Date;

    @IsString()
    @IsDateString()
    @IsNotEmpty()
    period_end: Date;

}
