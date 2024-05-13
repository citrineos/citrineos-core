import { IsString, MaxLength } from 'class-validator';
import { TokenType } from './TokenType';
import { Optional } from '../util/decorators/optional';
import { Enum } from '../util/decorators/enum';

export class PublishTokenType {
  @MaxLength(36)
  @IsString()
  @Optional()
  uid?: string | null;

  @Enum(TokenType, 'TokenType')
  @Optional()
  type?: TokenType | null;

  @MaxLength(64)
  @IsString()
  @Optional()
  visual_number?: string | null;

  @MaxLength(64)
  @IsString()
  @Optional()
  issuer?: string | null;

  @MaxLength(36)
  @IsString()
  @Optional()
  group_id?: string | null;
}
