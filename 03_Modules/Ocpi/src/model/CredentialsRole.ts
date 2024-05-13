import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Businessdetails } from './Businessdetails';
import { Role } from './Role';
import { Enum } from '../util/decorators/enum';

export class CredentialsRole {
  @Enum(Role, 'Role')
  @IsNotEmpty()
  role!: Role;

  @IsNotEmpty()
  business_details!: Businessdetails;

  @MaxLength(3)
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  party_id!: string;

  @MaxLength(2)
  @MinLength(2)
  @IsString()
  @IsNotEmpty()
  country_code!: string;
}
