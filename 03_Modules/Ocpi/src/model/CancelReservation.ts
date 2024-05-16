import {IsNotEmpty, IsString, MaxLength} from 'class-validator';
import {ResponseUrl} from "./ResponseUrl";

export class CancelReservation extends ResponseUrl {

  @MaxLength(36)
  @IsString()
  @IsNotEmpty()
  reservation_id!: string;

}
