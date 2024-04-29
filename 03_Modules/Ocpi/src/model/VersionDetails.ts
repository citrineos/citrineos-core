import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';
import { Endpoint } from './Endpoint';
import { VersionNumber } from './VersionNumber';
import { Table } from 'sequelize-typescript';

@Table
export class VersionDetails {
  @IsString()
  @IsNotEmpty()
  version!: VersionNumber;

  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  endpoints!: Endpoint[];
}
