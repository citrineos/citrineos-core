import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { faker } from '@faker-js/faker';
import { Authorization, IdToken, IdTokenInfo } from '../../src';

export function aAuthorization(updateFunction?: UpdateFunction<Authorization>): Authorization {
  const authorization = new Authorization() as Authorization;
  authorization.allowedConnectorTypes = [faker.string.alpha(10)];
  authorization.disallowedEvseIdPrefixes = [faker.string.alpha(10)];
  authorization.idTokenId = faker.number.int(10);
  authorization.idToken = { idToken: faker.string.alpha(10) } as IdToken;
  authorization.idTokenInfoId = faker.number.int(10);
  authorization.idTokenInfo = { groupIdTokenId: faker.string.alpha(10) } as unknown as IdTokenInfo;
  authorization.customData = { vendorId: faker.string.alpha(10) };

  return applyUpdateFunction(authorization, updateFunction);
}
