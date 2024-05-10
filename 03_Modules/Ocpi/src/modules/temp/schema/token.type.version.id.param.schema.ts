import { IsNotEmpty } from 'class-validator';
import { TokenType } from '../../../model/TokenType';
import { Enum } from '../../../util/enum';

export class TokenTypeVersionIdParam {
  @Enum(TokenType, 'TokenType')
  @IsNotEmpty()
  type = TokenType;
}
