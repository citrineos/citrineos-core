import {IsDateString, IsNotEmpty, IsObject, IsString,} from "class-validator";
import {ChargingprofilesActiveChargingProfile} from "./ChargingprofilesActiveChargingProfile";


export class ChargingprofilesActive {
    @IsString()
    @IsDateString()
    @IsNotEmpty()
    start_date_time: Date;

    @IsObject()
    @IsNotEmpty()
    charging_profile: ChargingprofilesActiveChargingProfile;

}
