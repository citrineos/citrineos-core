
import {
	IsString,
	IsNotEmpty,
	ArrayMinSize,
	IsArray,
} from "class-validator";
import {Endpoint} from "./Endpoint";
import {VersionNumber} from "./VersionNumber";
import {Table, Column, DataType, Model} from "sequelize-typescript";

@Table
export class VersionDetails {
	@IsString()
	@IsNotEmpty()
	version: VersionNumber;

	@ArrayMinSize(1)
	@IsArray()
	@IsNotEmpty()
	endpoints: Endpoint[];

}
