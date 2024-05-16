import {OcpiParams} from "../../util/ocpi.params";
import {IsNotEmpty, IsString, Length} from "class-validator";

export class GetLocationParams extends OcpiParams {

  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  countryCode!: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  partyId!: string;

  @IsString()
  @IsNotEmpty()
  @Length(36, 36)
  locationId!: string;
}
