import {IsDateString, IsNotEmpty, IsObject, IsString,} from "class-validator";
import {ProfileChargingProfile} from "./ProfileChargingProfile";


export class Profile {
    @IsString()
    @IsDateString()
    @IsNotEmpty()
    start_date_time: Date;

    @IsObject()
    @IsNotEmpty()
    charging_profile: ProfileChargingProfile;

}
