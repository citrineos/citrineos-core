import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class CommandsCancelReservationRequest {
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  response_url!: string;

  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  reservation_id!: string;
}
