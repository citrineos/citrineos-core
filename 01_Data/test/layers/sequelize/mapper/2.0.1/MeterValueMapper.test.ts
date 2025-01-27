import { expect } from '@jest/globals';
import { MeterValueMapper } from '../../../../../src/layers/sequelize/mapper/2.0.1';
import { aMeterValue, aOcpp201SampledValue } from '../../../../providers/MeterValue';

describe('MeterValueMapper', () => {
  describe('map MeterValue and MeterValueMapper', () => {
    it('should map between MeterValue and MeterValueMapper successfully', () => {
      const givenMeterValue = aMeterValue();

      const actualMapper = MeterValueMapper.fromModel(givenMeterValue);
      expect(actualMapper).toBeTruthy();
      expect(actualMapper.timestamp).toBe(givenMeterValue.timestamp);
      expect(actualMapper.transactionEventId).toBe(givenMeterValue.transactionEventId);
      expect(actualMapper.transactionDatabaseId).toBe(givenMeterValue.transactionDatabaseId);
      expect(actualMapper.customData).toEqual(givenMeterValue.customData);
      expect(actualMapper.sampledValue).toEqual(givenMeterValue.sampledValue);
    });

    it('should throw error with invalid values', () => {
      const sampledValueInvalidMeasurand1 = aOcpp201SampledValue((s) => ((s as any).measurand = 'InvalidMeasurand'));
      const sampledValueInvalidContext = aOcpp201SampledValue((s) => ((s as any).context = 'InvalidContext'));
      const givenMeterValue = aMeterValue((m) => (m.sampledValue = [sampledValueInvalidMeasurand1, sampledValueInvalidContext]));
      expect(() => MeterValueMapper.fromModel(givenMeterValue)).toThrowError(
        'sampledValue[0].measurand: InvalidMeasurand is invalid. sampledValue[1].context: InvalidContext is invalid. ',
      );
    });
  });
});
