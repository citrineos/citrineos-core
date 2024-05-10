import { IsArray, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LocationReferences {
  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  location_id!: string;

  @IsArray()
  evse_uids!: string[];
}
