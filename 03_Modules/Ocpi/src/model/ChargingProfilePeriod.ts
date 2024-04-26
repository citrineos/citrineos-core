
import { 
	IsInt,
	IsNotEmpty,
	IsDivisibleBy,
	IsNumber,
} from "class-validator";


export class ChargingProfilePeriod {
	@IsInt()
	@IsNotEmpty()
	start_period: number;

	@IsDivisibleBy(0.1)
	@IsNumber()
	@IsNotEmpty()
	limit: number;

}
