// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type AuthorizationDto,
  AuthorizationStatusEnum,
  AuthorizationWhitelistEnum,
  IdTokenEnum,
} from '@citrineos/types';
import { faker } from '@faker-js/faker';
import { applyUpdateFunction, type UpdateFunction } from '../utils/update-util.js';

export function anAuthorization(
  updateFunction?: UpdateFunction<AuthorizationDto>,
): AuthorizationDto {
  const item: AuthorizationDto = {
    tenantId: DEFAULT_TENANT_ID,
    idToken: faker.string.uuid(),
    idTokenType: IdTokenEnum.Central,
    status: AuthorizationStatusEnum.Accepted,
    groupAuthorizationId: 1,
    cacheExpiryDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    realTimeAuth: AuthorizationWhitelistEnum.Never,
  } as AuthorizationDto;

  return applyUpdateFunction(item, updateFunction);
}
