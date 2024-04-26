
import { 
	IsString,
	IsNotEmpty,
} from "class-validator";


export class ChargingprofilesClearProfileResult {
	@IsString()
	@IsNotEmpty()
	result: string;

}
