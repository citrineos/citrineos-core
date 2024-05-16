import {OcpiParams} from "../../util/ocpi.params";
import {IsNotEmpty, IsString, Length, ValidateNested} from "class-validator";
import {Type} from "class-transformer";
import {Connector} from "../../../model/Connector";

export class PutConnectorParams extends OcpiParams {

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

  @IsString()
  @IsNotEmpty()
  @Length(36, 36)
  evseUId!: string;

  @IsString()
  @IsNotEmpty()
  @Length(36, 36)
  connectorId!: string;

  @IsNotEmpty()
  @Type(() => Connector)
  @ValidateNested()
  connector!: Connector;
}
