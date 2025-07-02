import { Authorization } from '@citrineos/data';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { DEFAULT_TENANT_ID, OCPP2_0_1, RealTimeAuthEnumType } from '@citrineos/base';
import { faker } from '@faker-js/faker';

export function anAuthorization(updateFunction?: UpdateFunction<Authorization>): Authorization {
  const item = Object.create(Authorization.prototype) as Authorization;
  item.tenantId = DEFAULT_TENANT_ID;
  item.idToken = faker.string.uuid();
  item.idTokenType = OCPP2_0_1.IdTokenEnumType.Central;
  item.status = 'Accepted';
  item.groupAuthorizationId = 1;
  item.cacheExpiryDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  item.realTimeAuth = RealTimeAuthEnumType.Never;
  // Optionally add more default fields as needed

  return applyUpdateFunction(item, updateFunction);
}
