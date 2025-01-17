import { expect } from '@jest/globals';
import { Boot } from '../../../../../src';
import { BootMapper } from '../../../../../src/layers/sequelize/mapper/1.6';
import { aBoot } from '../../../../providers/Boot';

describe('BootMapper', () => {
  describe('map Boot and BootMapper', () => {
    it('should be equal after mapping', () => {
      const givenBoot = aBoot();

      const actualMapper = new BootMapper(givenBoot);
      expect(actualMapper).toBeTruthy();
      expect(actualMapper.id).toBe(givenBoot.id);
      expect(actualMapper.lastBootTime).toBe(givenBoot.lastBootTime);
      expect(actualMapper.heartbeatInterval).toBe(givenBoot.heartbeatInterval);
      expect(actualMapper.bootRetryInterval).toBe(givenBoot.bootRetryInterval);
      expect(actualMapper.status).toBe(givenBoot.status);
      expect(actualMapper.changeConfigurationsOnPending).toBe(givenBoot.changeConfigurationsOnPending);
      expect(actualMapper.getConfigurationsOnPending).toBe(givenBoot.getConfigurationsOnPending);

      const actualModel = actualMapper.toModel();
      expect(actualModel).toBeTruthy();
      expect(actualModel.id).toBe(givenBoot.id);
      expect(actualModel.lastBootTime).toBe(givenBoot.lastBootTime);
      expect(actualModel.heartbeatInterval).toBe(givenBoot.heartbeatInterval);
      expect(actualModel.bootRetryInterval).toBe(givenBoot.bootRetryInterval);
      expect(actualModel.status).toBe(givenBoot.status);
      expect(actualModel.changeConfigurationsOnPending).toBe(givenBoot.changeConfigurationsOnPending);
      expect(actualModel.getConfigurationsOnPending).toBe(givenBoot.getConfigurationsOnPending);
    });

    it('should throw error when invalid boot status', () => {
      const bootWithInvalidStatus: Boot = aBoot();
      console.log(`bootWithInvalidStatus: ${JSON.stringify(bootWithInvalidStatus)}`, `status: ${bootWithInvalidStatus}`);
      bootWithInvalidStatus.status = 'InvalidStatus';

      expect(() => new BootMapper(bootWithInvalidStatus)).toThrowError(
        `Validation failed: [{"value":"InvalidStatus","property":"status","children":[],"constraints":{"isEnum":"status must be one of the following values: Accepted, Pending, Rejected"}}]`,
      );
    });
  });
});
