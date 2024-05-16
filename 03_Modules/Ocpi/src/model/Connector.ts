import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import {ConnectorType} from './ConnectorType';
import {ConnectorFormat} from './ConnectorFormat';
import {PowerType} from './PowerType';
import {Type} from 'class-transformer';
import {Optional} from '../util/decorators/optional';
import {Enum} from '../util/decorators/enum';
import {OcpiResponse} from "../util/ocpi.response";

export class Connector {
  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  id!: string;

  @Enum(ConnectorType, 'ConnectorType')
  @IsNotEmpty()
  standard!: ConnectorType;

  @Enum(ConnectorFormat, 'ConnectorFormat')
  @IsNotEmpty()
  format!: ConnectorFormat;

  @Enum(PowerType, 'PowerType')
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

export class ConnectorResponse extends OcpiResponse<Connector> {
  @IsObject()
  @IsNotEmpty()
  @Type(() => Connector)
  @ValidateNested()
  data!: Connector;
}

export class ConnectorListResponse extends OcpiResponse<Connector[]> {
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => Connector)
  data!: Connector[];
}
