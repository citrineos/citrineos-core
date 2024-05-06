import { IsEnum, IsNotEmpty } from 'class-validator';
import { VersionNumber } from '../../../../../../00_Base/src/interfaces/api/ocpi/model/VersionNumber';

export class VersionIdParam {
  @IsEnum(VersionNumber)
  @IsNotEmpty()
  versionId!: VersionNumber;
}
