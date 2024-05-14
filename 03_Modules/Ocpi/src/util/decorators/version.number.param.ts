import { EnumParam } from './enum.param';
import {
  VersionNumber,
  VersionNumberEnumName,
} from '../../model/VersionNumber';

export const versionIdParam = 'versionId';

export const VersionNumberParam =
  () => (object: NonNullable<unknown>, methodName: string, index: number) => {
    // Apply the @EnumParam() decorator
    EnumParam(versionIdParam, VersionNumber, VersionNumberEnumName)(
      object,
      methodName,
      index,
    );
  };
