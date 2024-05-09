import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import {ConnectorType} from './ConnectorType';
import {ConnectorFormat} from './ConnectorFormat';
import {PowerType} from './PowerType';
import {Type} from 'class-transformer';
import {Optional} from "../util/optional";

export class Connector {
  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsEnum(ConnectorType)
  @IsNotEmpty()
  standard!: ConnectorType;

  @IsEnum(ConnectorFormat)
  @IsNotEmpty()
  format!: ConnectorFormat;

  @IsEnum(PowerType)
  @IsNotEmpty()
  power_type!: PowerType;

  @IsInt()
  @IsNotEmpty()
  max_voltage!: number;

  @IsInt()
  @IsNotEmpty()
  max_amperage!: number;

  @IsInt()
  @Optional()
  max_electric_power?: number | null;

  @IsArray()
  @Optional()
  tariff_ids?: null;

  @IsString()
  @IsUrl()
  @Optional()
  terms_and_conditions?: string | null;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  @Type(() => Date)
  last_updated!: Date;
}
