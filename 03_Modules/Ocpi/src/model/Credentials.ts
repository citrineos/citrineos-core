
import {
	MaxLength,
	IsString,
	IsNotEmpty,
	IsUrl,
	ArrayMinSize,
	IsArray,
} from "class-validator";
import {CredentialsRole} from "./CredentialsRole";


export class Credentials {
	@MaxLength(64)
	@IsString()
	@IsNotEmpty()
	token: string;

	@IsString()
	@IsUrl()
	@IsNotEmpty()
	url: string;

	@ArrayMinSize(1)
	@IsArray()
	@IsNotEmpty()
	roles: CredentialsRole[];

}
