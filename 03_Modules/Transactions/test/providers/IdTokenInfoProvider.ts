import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { OCPP2_0_1 } from '@citrineos/base';
import { faker } from '@faker-js/faker';

const locales = ['en', 'es', 'fr', 'de', 'it', 'nl'];

export function anIdTokenInfo(
  updateFunction?: UpdateFunction<OCPP2_0_1.IdTokenInfoType>,
): OCPP2_0_1.IdTokenInfoType {
  const locale1 = faker.helpers.arrayElement(locales);
  const item: OCPP2_0_1.IdTokenInfoType = {
    status: OCPP2_0_1.AuthorizationStatusEnumType.Accepted,
    cacheExpiryDateTime: faker.date.future().toISOString(),
    chargingPriority: faker.number.int({ min: 1, max: 5 }),
    language1: locale1,
    groupIdToken: {
      idToken: faker.string.uuid(),
      type: OCPP2_0_1.IdTokenEnumType.Central,
      additionalInfo: undefined,
    } as OCPP2_0_1.IdTokenType,
    language2: faker.helpers.arrayElement(locales),
    personalMessage: {
      language: locale1,
      content: faker.lorem.sentence(),
    } as OCPP2_0_1.MessageContentType,
    evseId: undefined,
  } as OCPP2_0_1.IdTokenInfoType;

  return applyUpdateFunction(item, updateFunction);
}
