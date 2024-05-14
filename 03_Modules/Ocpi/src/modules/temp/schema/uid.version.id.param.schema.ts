import { IsNotEmpty, IsString } from 'class-validator';

export class UidVersionIdParam {
  @IsString()
  @IsNotEmpty()
  uid!: string;
}
