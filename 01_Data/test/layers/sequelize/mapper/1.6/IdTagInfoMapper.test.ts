import { expect } from '@jest/globals';
import { IdTagInfoMapper, IdTokenMapper } from '../../../../../src/layers/sequelize/mapper/1.6';
import { aIdTokenInfo } from '../../../../providers/IdTokenInfo';

describe('IdTagInfo', () => {
  describe('map IdTokenInfo and IdTagInfoMapper', () => {
    it('should map between IdTokenInfo and IdTagInfoMapper successfully', () => {
      const givenIdTokenInfo = aIdTokenInfo();

      const actualMapper = IdTagInfoMapper.fromModel(givenIdTokenInfo);
      expect(actualMapper).toBeTruthy();
      expect(actualMapper.status).toBe(givenIdTokenInfo.status);
      expect(actualMapper.expiryDate).toBe(givenIdTokenInfo.cacheExpiryDateTime);
      expect(givenIdTokenInfo.groupIdToken).toBeTruthy();
      if (givenIdTokenInfo.groupIdToken) {
        expect(actualMapper.parentIdTag).toEqual(IdTokenMapper.fromModel(givenIdTokenInfo.groupIdToken));
      }
    });

    it('should throw error with invalid values', () => {
      const IdTagInfoInvalidStatus = aIdTokenInfo((i) => (i.status = 'InvalidStatus'));
      expect(() => IdTagInfoMapper.fromModel(IdTagInfoInvalidStatus)).toThrowError(
        `Validation failed: [{"value":"InvalidStatus","property":"status","children":[],"constraints":{"isEnum":"status must be one of the following values: Accepted, Blocked, Expired, Invalid, ConcurrentTx"}}]`,
      );
    });
  });
});
