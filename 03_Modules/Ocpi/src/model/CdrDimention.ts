import {IsEnum, IsNotEmpty, IsNumber,} from "class-validator";
import {CdrDimensionType} from "./CdrDimensionType";


export class CdrDimention {
    @IsEnum(CdrDimensionType)
    @IsNotEmpty()
    type: CdrDimensionType;

    @IsNumber()
    @IsNotEmpty()
    volume: number;

}
