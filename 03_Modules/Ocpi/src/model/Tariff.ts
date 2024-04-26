import {
    ArrayMinSize,
    IsArray,
    IsDateString,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    MinLength,
} from "class-validator";
import {Price} from "./Price";
import {TariffElement} from "./TariffElement";
import {EnergyMix} from "./EnergyMix";
import {Displaytext} from "./Displaytext";


export class Tariff {
    @MaxLength(36)
    @IsString()
    @IsNotEmpty()
    id: string;

    @MaxLength(2)
    @MinLength(2)
    @IsString()
    @IsNotEmpty()
    country_code: string;

    @MaxLength(3)
    @IsString()
    @IsNotEmpty()
    party_id: string;

    @MaxLength(3)
    @MinLength(3)
    @IsString()
    @IsNotEmpty()
    currency: string;

    @IsString()
    @IsOptional()
    type?: string | null;

    @IsArray()
    @IsOptional()
    tariff_alt_text?: Displaytext[] | null;

    @IsString()
    @IsUrl()
    @IsOptional()
    tariff_alt_url?: string | null;

    @IsOptional()
    min_price?: Price | null;

    @IsOptional()
    max_price?: Price | null;

    @ArrayMinSize(1)
    @IsArray()
    @IsNotEmpty()
    elements: TariffElement[];

    @IsOptional()
    energy_mix?: EnergyMix | null;

    @IsString()
    @IsDateString()
    @IsOptional()
    start_date_time?: Date | null;

    @IsString()
    @IsDateString()
    @IsOptional()
    end_date_time?: Date | null;

    @IsString()
    @IsDateString()
    @IsNotEmpty()
    last_updated: Date;

}
