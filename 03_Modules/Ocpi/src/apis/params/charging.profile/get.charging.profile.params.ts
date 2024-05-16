import {OcpiParams} from "../../util/ocpi.params";
import {IsInt, IsNotEmpty, IsString, IsUrl, Length} from "class-validator";

export class GetChargingProfileParams extends OcpiParams {
  @IsString()
  @IsNotEmpty()
  @Length(36, 36)
  sessionId!: string;

  @IsInt()
  @IsNotEmpty()
  duration!: number;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  responseUrl!: string;
}
