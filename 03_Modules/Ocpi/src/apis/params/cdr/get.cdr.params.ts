import {OcpiParams} from "../../util/ocpi.params";
import {IsNotEmpty, IsString} from "class-validator";

export class GetCdrParams extends OcpiParams {
  @IsNotEmpty()
  @IsString()
  url!: string;
}
