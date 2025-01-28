import { IdToken } from '@citrineos/data';
import { OCPP2_0_1 } from '@citrineos/base';
import { faker } from '@faker-js/faker';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';

export function anIdToken(
  updateFunction?: UpdateFunction<IdToken>,
): OCPP2_0_1.IdTokenType {
  const item: IdToken = {
    idToken: faker.string.uuid(),
    type: OCPP2_0_1.IdTokenEnumType.Central,
  } as IdToken;

  return applyUpdateFunction(item, updateFunction);
}
