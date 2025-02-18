import { expect } from '@jest/globals';
import { MeterValueMapper } from '../../../../../src/layers/sequelize/mapper/2.0.1';
import { aMeterValue } from '../../../../providers/MeterValue';

describe('MeterValueMapper', () => {
  describe('map MeterValue and MeterValueMapper', () => {
    it('should map between MeterValue and MeterValueMapper successfully', () => {
      const givenMeterValue = aMeterValue();

      const actualMapper = MeterValueMapper.toMeterValueType(givenMeterValue);
      expect(actualMapper).toBeTruthy();
      expect(actualMapper.timestamp).toBe(givenMeterValue.timestamp);
      expect(actualMapper.sampledValue).toEqual(givenMeterValue.sampledValue);
      expect(actualMapper.customData).toEqual(givenMeterValue.customData);
    });
  });
});
