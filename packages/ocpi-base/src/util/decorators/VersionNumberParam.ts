// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { EnumParam } from './EnumParam.js';
import { VersionNumber, VersionNumberEnumName } from '../../model/VersionNumber.js';

export const versionIdParam = 'versionId';

/**
 * VersionNumberParam convenience decorator will extract the version number from the request params. Allows to easily
 * access version number in request handler like so:
 *
 * @Get()
 * some(@VersionNumberParam() versionNumber: VersionNumber) {
 *   console.log(versionNumber);
 * }
 */
export const VersionNumberParam =
  () => (object: NonNullable<unknown>, methodName: string, index: number) => {
    // Apply the @EnumParam() decorator
    EnumParam(versionIdParam, VersionNumber, VersionNumberEnumName)(object, methodName, index);
  };
