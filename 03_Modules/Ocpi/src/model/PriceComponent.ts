import {IsInt, IsNotEmpty, IsNumber, IsOptional, IsString,} from "class-validator";
import {TariffDimensionType} from "./TariffDimensionType";


export class PriceComponent {
    @IsString()
    @IsNotEmpty()
    type: TariffDimensionType;

    @IsNumber()
    @IsNotEmpty()
    price: number;

    @IsNumber()
    @IsOptional()
    vat?: number | null;

    @IsInt()
    @IsNotEmpty()
    step_size: number;

}
