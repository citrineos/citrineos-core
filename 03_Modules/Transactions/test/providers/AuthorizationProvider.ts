import { Authorization } from '@citrineos/data';
import { anIdToken } from './IdTokenProvider';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { DEFAULT_TENANT_ID } from '@citrineos/base';

export function anAuthorization(updateFunction?: UpdateFunction<Authorization>): Authorization {
  const idTokenObj = anIdToken();
  const item = Object.create(Authorization.prototype) as Authorization;
  item.tenantId = DEFAULT_TENANT_ID;
  item.idToken = idTokenObj.idToken;
  item.idTokenType = idTokenObj.type;
  item.status = 'Accepted';
  item.groupAuthorizationId = 1;
  item.cacheExpiryDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  // Optionally add more default fields as needed

  return applyUpdateFunction(item, updateFunction);
}
