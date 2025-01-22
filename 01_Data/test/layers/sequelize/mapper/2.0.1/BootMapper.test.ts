import { expect } from '@jest/globals';
import { Boot } from '../../../../../src';
import { BootMapper } from '../../../../../src/layers/sequelize/mapper/2.0.1';
import { aBoot } from '../../../../providers/Boot';

describe('BootMapper', () => {
  describe('map Boot and BootMapper', () => {
    it('should be equal after mapping', () => {
      const givenBoot = aBoot();

      const actualMapper = BootMapper.fromModel(givenBoot);
      expect(actualMapper).toBeTruthy();
      expect(actualMapper.id).toBe(givenBoot.id);
      expect(actualMapper.lastBootTime).toBe(givenBoot.lastBootTime);
      expect(actualMapper.heartbeatInterval).toBe(givenBoot.heartbeatInterval);
      expect(actualMapper.bootRetryInterval).toBe(givenBoot.bootRetryInterval);
      expect(actualMapper.status).toBe(givenBoot.status);
      expect(actualMapper.statusInfo).toEqual(givenBoot.statusInfo);
      expect(actualMapper.getBaseReportOnPending).toBe(givenBoot.getBaseReportOnPending);
      expect(actualMapper.pendingBootSetVariables).toEqual(givenBoot.pendingBootSetVariables);
      expect(actualMapper.variablesRejectedOnLastBoot).toEqual(givenBoot.variablesRejectedOnLastBoot);
      expect(actualMapper.bootWithRejectedVariables).toEqual(givenBoot.bootWithRejectedVariables);
      expect(actualMapper.customData).toEqual(givenBoot.customData);
    });

    it('should throw error when missing required fields', () => {
      const bootMissingRequiredFields: Boot = aBoot();
      bootMissingRequiredFields.variablesRejectedOnLastBoot = null;

      expect(() => BootMapper.fromModel(bootMissingRequiredFields)).toThrowError(
        `Validation failed: [{"value":null,"property":"variablesRejectedOnLastBoot","children":[],"constraints":{"isNotEmpty":"variablesRejectedOnLastBoot should not be empty"}}]`,
      );
    });

    it('should throw error when invalid boot status', () => {
      const bootWithInvalidStatus: Boot = aBoot();
      console.log(`bootWithInvalidStatus: ${JSON.stringify(bootWithInvalidStatus)}`, `status: ${bootWithInvalidStatus}`);
      bootWithInvalidStatus.status = 'InvalidStatus';

      expect(() => BootMapper.fromModel(bootWithInvalidStatus)).toThrowError(
        `Validation failed: [{"value":"InvalidStatus","property":"status","children":[],"constraints":{"isEnum":"status must be one of the following values: Accepted, Pending, Rejected"}}]`,
      );
    });
  });
});
