import {OcpiParams} from "../../util/ocpi.params";
import {IsNotEmpty, ValidateNested} from "class-validator";
import {Type} from "class-transformer";
import {Cdr} from "../../../model/Cdr";

export class PostCdrParams extends OcpiParams {
  @IsNotEmpty()
  @Type(() => Cdr)
  @ValidateNested()
  cdr!: Cdr;
}
