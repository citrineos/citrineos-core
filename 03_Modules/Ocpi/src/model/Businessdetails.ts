
import { 
	MaxLength,
	IsString,
	IsNotEmpty,
	IsUrl,
	IsOptional,
} from "class-validator";
import {Image} from "./Image";


export class Businessdetails {
	@MaxLength(100)
	@IsString()
	@IsNotEmpty()
	name: string;

	@IsString()
	@IsUrl()
	@IsOptional()
	website?: string | null;

	@IsOptional()
	logo?: Image | null;

}
