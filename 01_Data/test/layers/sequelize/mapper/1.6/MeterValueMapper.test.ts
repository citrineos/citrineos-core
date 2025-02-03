import { expect } from '@jest/globals';
import { MeterValueMapper } from '../../../../../src/layers/sequelize/mapper/1.6';
import { aMeterValue, aOcpp16SampledValue } from '../../../../providers/MeterValue';

describe('MeterValueMapper', () => {
  describe('map MeterValue and MeterValueMapper', () => {
    it('should map between MeterValue and MeterValueMapper successfully', () => {
      const givenMeterValue = aMeterValue((m) => (m.sampledValue = [aOcpp16SampledValue()]));

      const actualMapper = MeterValueMapper.fromModel(givenMeterValue);
      expect(actualMapper).toBeTruthy();
      expect(actualMapper.timestamp).toBe(givenMeterValue.timestamp);
      expect(actualMapper.transactionDatabaseId).toBe(givenMeterValue.transactionDatabaseId);
      expect(actualMapper.sampledValue).toEqual(givenMeterValue.sampledValue);
      expect(actualMapper.connectorDatabaseId).toBe(givenMeterValue.connectorDatabaseId);
    });

    it('should throw error with invalid values', () => {
      const sampledValueInvalidMeasurand1 = aOcpp16SampledValue((s) => ((s as any).measurand = 'InvalidMeasurand'));
      const sampledValueInvalidContext = aOcpp16SampledValue((s) => ((s as any).context = 'InvalidContext'));
      const givenMeterValue = aMeterValue((m) => (m.sampledValue = [sampledValueInvalidMeasurand1, sampledValueInvalidContext]));
      expect(() => MeterValueMapper.fromModel(givenMeterValue)).toThrowError(
        `Validation failed: [{"value":[{"value":"79","context":"Transaction.Begin","format":"Raw","measurand":"InvalidMeasurand","phase":"L1","location":"Outlet","unit":"kWh"},{"value":"79","context":"InvalidContext","format":"Raw","measurand":"Energy.Active.Import.Register","phase":"L1","location":"Outlet","unit":"kWh"}],"property":"sampledValue","children":[{"value":{"value":"79","context":"Transaction.Begin","format":"Raw","measurand":"InvalidMeasurand","phase":"L1","location":"Outlet","unit":"kWh"},"property":"0","children":[{"value":"InvalidMeasurand","property":"measurand","children":[],"constraints":{"isEnum":"Invalid measurand value."}}]},{"value":{"value":"79","context":"InvalidContext","format":"Raw","measurand":"Energy.Active.Import.Register","phase":"L1","location":"Outlet","unit":"kWh"},"property":"1","children":[{"value":"InvalidContext","property":"context","children":[],"constraints":{"isEnum":"Invalid context value."}}]}]}]`,
      );
    });

    it('should not validate an optional field when it is null or undefined', () => {
      const sampledValueNullContext = aOcpp16SampledValue((s) => ((s as any).context = null));
      const givenMeterValue = aMeterValue((m) => (m.sampledValue = [sampledValueNullContext]));
      expect(() => MeterValueMapper.fromModel(givenMeterValue)).not.toThrowError();
    })
  });
});
