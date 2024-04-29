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
import { ConnectorType } from './ConnectorType';
import { ConnectorFormat } from './ConnectorFormat';
import { PowerType } from './PowerType';

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
  @IsOptional()
  max_electric_power?: number | null;

  @IsArray()
  @IsOptional()
  tariff_ids?: null;

  @IsString()
  @IsUrl()
  @IsOptional()
  terms_and_conditions?: string | null;

  @IsString()
  @IsDateString()
  @IsNotEmpty()
  last_updated!: Date;
}
