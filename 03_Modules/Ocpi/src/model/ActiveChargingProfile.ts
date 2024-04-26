import {IsDateString, IsNotEmpty, IsObject, IsString,} from "class-validator";
import {ChargingProfile} from "./ChargingProfile";


export class ActiveChargingProfile {
    @IsString()
    @IsDateString()
    @IsNotEmpty()
    start_date_time: Date;

    @IsObject()
    @IsNotEmpty()
    charging_profile: ChargingProfile;

}
