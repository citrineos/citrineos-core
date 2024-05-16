import {IsNotEmpty, IsString, IsUrl} from "class-validator";

export class ResponseUrl {

  @IsString()
  @IsUrl()
  @IsNotEmpty()
  response_url!: string;

}
