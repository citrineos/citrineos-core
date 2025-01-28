import { expect } from '@jest/globals';
import { IdTokenInfoMapper, IdTokenMapper } from '../../../../../src/layers/sequelize/mapper/2.0.1';
import { aIdTokenInfo } from '../../../../providers/IdTokenInfo';

describe('IdTokenInfo', () => {
  describe('map IdTokenInfo and IdTokenInfoMapper', () => {
    it('should map between IdTokenInfo and IdTokenInfoMapper successfully', () => {
      const givenIdTokenInfo = aIdTokenInfo();

      const actualMapper = IdTokenInfoMapper.fromModel(givenIdTokenInfo);
      expect(actualMapper).toBeTruthy();
      expect(actualMapper.status).toBe(givenIdTokenInfo.status);
      expect(actualMapper.cacheExpiryDateTime).toBe(givenIdTokenInfo.cacheExpiryDateTime);
      expect(actualMapper.chargingPriority).toBe(givenIdTokenInfo.chargingPriority);
      expect(actualMapper.language1).toBe(givenIdTokenInfo.language1);
      expect(actualMapper.evseId).toEqual(givenIdTokenInfo.evseId);
      expect(givenIdTokenInfo.groupIdToken).toBeTruthy();
      if (givenIdTokenInfo.groupIdToken) {
        expect(actualMapper.groupIdToken).toEqual(IdTokenMapper.fromModel(givenIdTokenInfo.groupIdToken));
      }
      expect(actualMapper.language2).toBe(givenIdTokenInfo.language2);
      expect(actualMapper.personalMessage).toEqual(givenIdTokenInfo.personalMessage);
      expect(actualMapper.customData).toEqual(givenIdTokenInfo.customData);
    });

    it('should throw error with invalid values', () => {
      const IdTokenInfoInvalidStatus = aIdTokenInfo((i) => (i.status = 'InvalidStatus'));
      expect(() => IdTokenInfoMapper.fromModel(IdTokenInfoInvalidStatus)).toThrowError(
        `Validation failed: [{"value":"InvalidStatus","property":"status","children":[],"constraints":{"isEnum":"status must be one of the following values: Accepted, Blocked, ConcurrentTx, Expired, Invalid, NoCredit, NotAllowedTypeEVSE, NotAtThisLocation, NotAtThisTime, Unknown"}}]`,
      );
    });
  });
});
