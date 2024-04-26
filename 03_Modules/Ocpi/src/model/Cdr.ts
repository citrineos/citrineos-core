import {
    ArrayMinSize,
    IsArray,
    IsBoolean,
    IsDateString,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from "class-validator";
import {CdrToken} from "./CdrToken";
import {CdrLocation} from "./CdrLocation";
import {ChargingPeriod} from "./ChargingPeriod";
import {SignedData} from "./SignedData";
import {Price} from "./Price";
import {AuthMethod} from "./AuthMethod";
import {Tariff} from "./Tariff";


export class Cdr {
    @MaxLength(2)
    @MinLength(2)
    @IsString()
    @IsNotEmpty()
    country_code: string;

    @MaxLength(3)
    @IsString()
    @IsNotEmpty()
    party_id: string;

    @MaxLength(39)
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsString()
    @IsDateString()
    @IsNotEmpty()
    start_date_time: Date;

    @IsString()
    @IsDateString()
    @IsNotEmpty()
    end_date_time: Date;

    @MaxLength(36)
    @IsString()
    @IsOptional()
    session_id?: string | null;

    @IsObject()
    @IsNotEmpty()
    cdr_token: CdrToken;

    @IsString()
    @IsNotEmpty()
    auth_method: AuthMethod;

    @MaxLength(36)
    @IsString()
    @IsOptional()
    authorization_reference?: string | null;

    @IsObject()
    @IsNotEmpty()
    cdr_location: CdrLocation;

    @MaxLength(255)
    @IsString()
    @IsOptional()
    meter_id?: string | null;

    @MaxLength(3)
    @MinLength(3)
    @IsString()
    @IsNotEmpty()
    currency: string;

    @IsArray()
    @IsOptional()
    tariffs?: Tariff[] | null;

    @ArrayMinSize(1)
    @IsArray()
    @IsNotEmpty()
    charging_periods: ChargingPeriod[];

    @IsOptional()
    signed_data?: SignedData | null;

    @IsNotEmpty()
    total_cost: Price;

    @IsOptional()
    total_fixed_cost?: Price | null;

    @IsNumber()
    @IsNotEmpty()
    total_energy: number;

    @IsOptional()
    total_energy_cost?: Price | null;

    @IsNumber()
    @IsNotEmpty()
    total_time: number;

    @IsOptional()
    total_time_cost?: Price | null;

    @IsNumber()
    @IsOptional()
    total_parking_time?: number | null;

    @IsOptional()
    total_parking_cost?: Price | null;

    @IsOptional()
    total_reservation_cost?: Price | null;

    @MaxLength(255)
    @IsString()
    @IsOptional()
    remark?: string | null;

    @MaxLength(39)
    @IsString()
    @IsOptional()
    invoice_reference_id?: string | null;

    @IsOptional()
    @IsBoolean()
    credit?: boolean | null;

    @MaxLength(39)
    @IsString()
    @IsOptional()
    credit_reference_id?: string | null;

    @IsOptional()
    @IsBoolean()
    home_charging_compensation?: boolean | null;

    @IsString()
    @IsDateString()
    @IsNotEmpty()
    last_updated: Date;

}
