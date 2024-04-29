
import {
	IsString,
	IsUrl,
	IsNotEmpty,
	MaxLength,
} from 'class-validator';


export class CommandsUnlockConnectorRequest {
	@IsString()
	@IsUrl()
	@IsNotEmpty()
	response_url!: string;

	@MaxLength(36)
	@IsString()
	@IsNotEmpty()
	location_id!: string;

	@MaxLength(36)
	@IsString()
	@IsNotEmpty()
	evse_uid!: string;

	@MaxLength(36)
	@IsString()
	@IsNotEmpty()
	connector_id!: string;

}
