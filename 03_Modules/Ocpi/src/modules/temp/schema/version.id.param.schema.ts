import { IsNotEmpty } from 'class-validator';
import { VersionNumber } from '../../../model/VersionNumber';
import { Enum } from '../../../util/enum';

export class VersionIdParam {
  @Enum(VersionNumber, 'VersionNumber')
  @IsNotEmpty()
  versionId!: VersionNumber;
}
