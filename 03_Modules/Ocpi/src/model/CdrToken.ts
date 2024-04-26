
import {
	MaxLength,
	IsString,
	IsNotEmpty,
	IsOptional,
} from "class-validator";
import {TokenType} from "./TokenType";


export class CdrToken {
	@MaxLength(36)
	@IsString()
	@IsNotEmpty()
	uid: string;

	@IsString()
	@IsOptional()
	type?: TokenType | null;

	@MaxLength(36)
	@IsString()
	@IsNotEmpty()
	contract_id: string;

	@MaxLength(2)
	@IsString()
	@IsNotEmpty()
	country_code: string;

	@MaxLength(3)
	@IsString()
	@IsNotEmpty()
	party_id: string;

}
