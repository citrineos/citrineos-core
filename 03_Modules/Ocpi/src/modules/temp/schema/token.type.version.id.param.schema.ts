import { IsEnum, IsNotEmpty } from 'class-validator';
import { TokenType } from '../../../model/TokenType';

export class TokenTypeVersionIdParam {
  @IsEnum(TokenType)
  @IsNotEmpty()
  type = TokenType;
}
