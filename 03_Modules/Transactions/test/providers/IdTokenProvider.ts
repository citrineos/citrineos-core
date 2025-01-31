import { OCPP2_0_1 } from '@citrineos/base';
import { faker } from '@faker-js/faker';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';

export function anIdToken(
  updateFunction?: UpdateFunction<OCPP2_0_1.IdTokenType>,
): OCPP2_0_1.IdTokenType {
  const item: OCPP2_0_1.IdTokenType = {
    idToken: faker.string.uuid(),
    type: OCPP2_0_1.IdTokenEnumType.Central,
  } as OCPP2_0_1.IdTokenType;

  return applyUpdateFunction(item, updateFunction);
}
