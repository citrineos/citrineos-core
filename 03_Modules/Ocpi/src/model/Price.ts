
import { 
	IsNumber,
	IsNotEmpty,
	IsOptional,
} from "class-validator";


export class Price {
	@IsNumber()
	@IsNotEmpty()
	excl_vat: number;

	@IsNumber()
	@IsOptional()
	incl_vat?: number | null;

}
