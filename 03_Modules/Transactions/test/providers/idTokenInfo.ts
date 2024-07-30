import { IdTokenInfo } from '@citrineos/data';
import { UpdateFunction } from './update';
import {
  AuthorizationStatusEnumType,
  IdTokenEnumType,
  IdTokenInfoType,
  IdTokenType,
  MessageContentType,
} from '@citrineos/base';
import { faker } from '@faker-js/faker';

const locales = ['en', 'es', 'fr', 'de', 'it', 'nl'];

export const aValidIdTokenInfo = (
  updateFunction?: UpdateFunction<IdTokenInfoType>,
): IdTokenInfoType => {
  const locale1 = faker.helpers.arrayElement(locales);
  const item: IdTokenInfoType = {
    status: AuthorizationStatusEnumType.Accepted,
    cacheExpiryDateTime: faker.date.future().toISOString(),
    chargingPriority: faker.number.int({ min: 1, max: 5 }),
    language1: locale1,
    groupIdToken: {
      idToken: faker.string.uuid(),
      type: IdTokenEnumType.Central,
      additionalInfo: undefined,
    } as IdTokenType,
    language2: faker.helpers.arrayElement(locales),
    personalMessage: {
      language: locale1,
      content: faker.lorem.sentence(),
    } as MessageContentType,
    evseId: undefined,
  } as IdTokenInfoType;

  if (updateFunction) {
    updateFunction(item);
  }

  return item;
};
