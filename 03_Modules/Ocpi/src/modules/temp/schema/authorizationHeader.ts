import { IsString } from 'class-validator';
import { Optional } from '../../../util/optional';

export class AuthorizationHeader {
  @IsString()
  @Optional()
  Authorization?: string;
}
