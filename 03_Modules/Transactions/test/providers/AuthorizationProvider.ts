import { Authorization } from '@citrineos/data';
import { anIdToken } from './IdTokenProvider';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { DEFAULT_TENANT_ID } from '@citrineos/base';

export function anAuthorization(updateFunction?: UpdateFunction<Authorization>): Authorization {
  const idTokenObj = anIdToken();
  const item: Authorization = {
    tenantId: DEFAULT_TENANT_ID,
    idToken: idTokenObj.idToken, // string value
    idTokenType: idTokenObj.type, // string value
    status: 'Accepted', // default valid status
    // Optionally add more default fields as needed
  } as Authorization;

  return applyUpdateFunction(item, updateFunction);
}
