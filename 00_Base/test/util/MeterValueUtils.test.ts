import { MeterValueUtils } from '../../src/util/MeterValueUtils';
import { OCPP2_0_1 } from '../../src/ocpp/model';

function makeMeterValue(ts: string, meas: OCPP2_0_1.MeasurandEnumType, value: number) {
  return {
    timestamp: ts,
    sampledValue: [
      {
        measurand: meas,
        unitOfMeasure: { unit: 'KWH' },
        value,
      },
    ],
  } as OCPP2_0_1.MeterValueType;
}

describe('MeterValueUtils', () => {
  it('Sums Interval readings', () => {
    const meterValues = [
      makeMeterValue(
        '2025-05-29T12:01:00Z',
        OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Interval,
        50,
      ),
      makeMeterValue(
        '2025-05-29T12:02:00Z',
        OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Interval,
        49,
      ),
      makeMeterValue(
        '2025-05-29T12:03:00Z',
        OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Interval,
        46,
      ),
      makeMeterValue(
        '2025-05-29T12:04:00Z',
        OCPP2_0_1.MeasurandEnumType.Energy_Active_Import_Interval,
        52,
      ),
    ];
    expect(MeterValueUtils.getTotalKwh(meterValues)).toBe(50 + 49 + 46 + 52);
  });

  it('Picks latest Net reading', () => {
    const meterValues = [
      makeMeterValue('2025-05-29T12:01:00Z', OCPP2_0_1.MeasurandEnumType.Energy_Active_Net, 50),
      makeMeterValue('2025-05-29T12:02:00Z', OCPP2_0_1.MeasurandEnumType.Energy_Active_Net, 100),
      makeMeterValue('2025-05-29T12:03:00Z', OCPP2_0_1.MeasurandEnumType.Energy_Active_Net, 153),
      makeMeterValue('2025-05-29T12:04:00Z', OCPP2_0_1.MeasurandEnumType.Energy_Active_Net, 201),
    ];
    expect(MeterValueUtils.getTotalKwh(meterValues)).toBe(201);
  });
});
