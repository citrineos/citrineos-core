import {OcpiParams} from "../../util/ocpi.params";
import {IsNotEmpty, IsString, ValidateNested} from "class-validator";
import {Type} from "class-transformer";
import {CommandResult} from "../../../model/CommandResponse";

export class PostCommandParams extends OcpiParams {
  @IsNotEmpty()
  @IsString()
  url!: string;

  @IsNotEmpty()
  @Type(() => CommandResult)
  @ValidateNested()
  commandResult!: CommandResult;
}
