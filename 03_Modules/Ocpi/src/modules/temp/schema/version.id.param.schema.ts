import { IsEnum, IsNotEmpty } from 'class-validator';
import { VersionNumber } from '../../../model/VersionNumber';

export class VersionIdParam {
  @IsEnum(VersionNumber)
  @IsNotEmpty()
  versionId!: VersionNumber;
}
