import {OcpiParams} from "../../util/ocpi.params";
import {SetChargingProfile} from "../../../model/SetChargingProfile";
import {IsNotEmpty, IsString, Length, ValidateNested} from "class-validator";
import {Type} from "class-transformer";

export class PutChargingProfileParams extends OcpiParams {

  @IsString()
  @IsNotEmpty()
  @Length(36, 36)
  sessionId!: string;

  @IsNotEmpty()
  @Type(() => SetChargingProfile)
  @ValidateNested()
  setChargingProfile!: SetChargingProfile;
}
