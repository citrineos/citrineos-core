import { expect } from '@jest/globals';
import { AuthorizationMapper } from '../../../../../src/layers/sequelize/mapper/2.0.1';
import { aAuthorization } from '../../../../providers/Authorization';

describe('Authorization', () => {
  describe('map Authorization and AuthorizationMapper', () => {
    it('should map between Authorization and AuthorizationMapper successfully', () => {
      const givenAuthorization = aAuthorization();

      const actualMapper = AuthorizationMapper.fromModel(givenAuthorization);
      expect(actualMapper).toBeTruthy();
      expect(actualMapper.allowedConnectorTypes).toBe(givenAuthorization.allowedConnectorTypes);
      expect(actualMapper.disallowedEvseIdPrefixes).toBe(givenAuthorization.disallowedEvseIdPrefixes);
      expect(actualMapper.idTokenId).toEqual(givenAuthorization.idTokenId);
      expect(actualMapper.idToken).toBe(givenAuthorization.idToken);
      expect(actualMapper.idTokenInfoId).toEqual(givenAuthorization.idTokenInfoId);
      expect(actualMapper.idTokenInfo).toBe(givenAuthorization.idTokenInfo);
      expect(actualMapper.customData).toBe(givenAuthorization.customData);
    });
  });
});
