// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AuthorizationStatusEnum,
  AuthorizationWhitelistEnum,
  DEFAULT_TENANT_ID,
  IdTokenEnum,
} from '@citrineos/base';
import { Authorization } from '@citrineos/data';
import { faker } from '@faker-js/faker';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil.js';

export function anAuthorization(updateFunction?: UpdateFunction<Authorization>): Authorization {
  const item = Object.create(Authorization.prototype) as Authorization;
  item.tenantId = DEFAULT_TENANT_ID;
  item.idToken = faker.string.uuid();
  item.idTokenType = IdTokenEnum.Central;
  item.status = AuthorizationStatusEnum.Accepted;
  item.groupAuthorizationId = 1;
  item.cacheExpiryDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  item.realTimeAuth = AuthorizationWhitelistEnum.Never;
  // Optionally add more default fields as needed

  return applyUpdateFunction(item, updateFunction);
}
