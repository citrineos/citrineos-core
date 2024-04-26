
import { 
	IsString,
	IsNotEmpty,
	IsOptional,
} from "class-validator";
import {ChargingprofilesActiveChargingProfileResultProfile} from "./ChargingprofilesActiveChargingProfileResultProfile";


export class ChargingprofilesActiveChargingProfileResult {
	@IsString()
	@IsNotEmpty()
	result: string;

	@IsOptional()
	profile?: ChargingprofilesActiveChargingProfileResultProfile | null;

}
