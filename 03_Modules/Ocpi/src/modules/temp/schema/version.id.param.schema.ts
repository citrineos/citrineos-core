import { IsNotEmpty } from 'class-validator';
import { VersionNumber } from '../../../model/VersionNumber';
import { Enum } from '../../../util/decorators/enum';

export class VersionIdParam {
  @Enum(VersionNumber, 'VersionNumber')
  @IsNotEmpty()
  versionId!: VersionNumber;
}
