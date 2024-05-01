import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class GeoLocation {
  @MaxLength(10)
  @Matches(/-?[0-9]{1,2}\.[0-9]{5,7}/)
  @IsString()
  @IsNotEmpty()
  latitude!: string;

  @MaxLength(11)
  @Matches(/-?[0-9]{1,3}\.[0-9]{5,7}/)
  @IsString()
  @IsNotEmpty()
  longitude!: string;
}
