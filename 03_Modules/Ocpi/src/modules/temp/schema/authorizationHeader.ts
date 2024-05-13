import { IsString } from 'class-validator';
import { Optional } from '../../../util/decorators/optional';

export class AuthorizationHeader {
  @IsString()
  @Optional()
  Authorization?: string;
}
