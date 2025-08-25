// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { Authorization } from '@citrineos/data';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import {
  AuthorizationStatusType,
  DEFAULT_TENANT_ID,
  IdTokenType,
  AuthorizationWhitelistType,
} from '@citrineos/base';
import { faker } from '@faker-js/faker';

export function anAuthorization(updateFunction?: UpdateFunction<Authorization>): Authorization {
  const item = Object.create(Authorization.prototype) as Authorization;
  item.tenantId = DEFAULT_TENANT_ID;
  item.idToken = faker.string.uuid();
  item.idTokenType = IdTokenType.Central;
  item.status = AuthorizationStatusType.Accepted;
  item.groupAuthorizationId = 1;
  item.cacheExpiryDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  item.realTimeAuth = AuthorizationWhitelistType.Never;
  // Optionally add more default fields as needed

  return applyUpdateFunction(item, updateFunction);
}
