import { expect } from '@jest/globals';
import { IdTokenMapper } from '../../../../../src/layers/sequelize/mapper/2.0.1';
import { aIdToken } from '../../../../providers/IdToken';

describe('IdToken', () => {
  describe('map IdToken and IdTokenMapper', () => {
    it('should map between IdToken and IdTokenMapper successfully', () => {
      const givenIdToken = aIdToken();

      const actualMapper = IdTokenMapper.fromModel(givenIdToken);
      expect(actualMapper).toBeTruthy();
      expect(actualMapper.idToken).toBe(givenIdToken.idToken);
      expect(actualMapper.type).toBe(givenIdToken.type);
      expect(actualMapper.additionalInfo).toEqual(givenIdToken.additionalInfo);
      expect(actualMapper.customData).toEqual(givenIdToken.customData);
    });

    it('should throw error with invalid values', () => {
      const idTokenInvalidType = aIdToken((i) => (i.type = 'Invalid'));
      expect(() => IdTokenMapper.fromModel(idTokenInvalidType)).toThrowError(
        `Validation failed: [{"value":"Invalid","property":"type","children":[],"constraints":{"isEnum":"type must be one of the following values: Central, eMAID, ISO14443, ISO15693, KeyCode, Local, MacAddress, NoAuthorization"}}]`,
      );
    });
  });
});
