import { VersionNumber } from './model/VersionNumber';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUrl,
} from 'class-validator';
import {
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Endpoint } from './model/Endpoint';
import { OcpiNamespace } from './OcpiNamespace';

export class VersionDTO {
  @IsNotEmpty()
  @IsEnum(VersionNumber)
  version!: VersionNumber;

  @IsString()
  @IsUrl()
  url!: string;
}

export class VersionDetailsDTO {
  @IsNotEmpty()
  @IsEnum(VersionNumber)
  version!: VersionNumber;

  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  endpoints!: Endpoint[];
}

@Table
export class Version extends Model {
  static readonly MODEL_NAME: string = OcpiNamespace.Version;

  @PrimaryKey
  @Column({
    type: DataType.STRING,
    unique: 'version_number_type',
  })
  @IsNotEmpty()
  @IsEnum(VersionNumber)
  version!: VersionNumber;

  @Column(DataType.STRING)
  @IsString()
  @IsUrl()
  url!: string;

  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  endpoints!: Endpoint[];

  public toVersionDTO(): VersionDTO {
    const dto = new VersionDTO();
    dto.version = this.version;
    dto.url = this.url;
    return dto;
  }

  public toVersionDetailsDTO(): VersionDetailsDTO {
    const dto = new VersionDetailsDTO();
    dto.version = this.version;
    dto.endpoints = this.endpoints;
    return dto;
  }
}
