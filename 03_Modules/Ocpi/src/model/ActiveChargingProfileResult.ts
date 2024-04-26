import {IsEnum, IsNotEmpty, IsOptional} from "class-validator";
import {ActiveChargingProfile} from "./ActiveChargingProfile";
import {ChargingProfileResultType} from "./ChargingProfileResponse";


export class ActiveChargingProfileResult {
    @IsEnum(ChargingProfileResultType)
    @IsNotEmpty()
    result: ChargingProfileResultType;

    @IsOptional()
    profile?: ActiveChargingProfile | null;

}
