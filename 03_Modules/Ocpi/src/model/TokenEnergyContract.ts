
import { 
	MaxLength,
	IsString,
	IsNotEmpty,
	IsOptional,
} from "class-validator";


export class EnergyContract {
	@MaxLength(64)
	@IsString()
	@IsNotEmpty()
	supplier_name: string;

	@MaxLength(64)
	@IsString()
	@IsOptional()
	contract_id?: string | null;

}
