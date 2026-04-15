// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';
import { MeterValueUtils, type MeterValueDto, type SampledValue } from '../../src';

function makeMeterValue(
  ts: string,
  measurand: SampledValue['measurand'],
  value: number,
  unit: string = 'kWh',
  context?: SampledValue['context'],
): MeterValueDto {
  return {
    timestamp: ts,
    sampledValue: [
      {
        measurand,
        unitOfMeasure: { unit, multiplier: 0 },
        value,
        context,
      },
    ],
  };
}

describe('MeterValueUtils', () => {
  describe('getTotalKwh', () => {
    describe('Register values', () => {
      it('calculates difference between first and last register readings without meterStart', () => {
        const meterValues = [
          makeMeterValue('2025-05-29T12:01:00Z', 'Energy.Active.Import.Register', 100),
          makeMeterValue('2025-05-29T12:02:00Z', 'Energy.Active.Import.Register', 150),
          makeMeterValue('2025-05-29T12:03:00Z', 'Energy.Active.Import.Register', 200),
        ];
        expect(MeterValueUtils.getTotalKwh(meterValues, 0)).toBe(100); // 200 - 100 = 100
      });

      it('calculates difference from meterStart when provided', () => {
        const meterValues = [
          makeMeterValue('2025-05-29T12:01:00Z', 'Energy.Active.Import.Register', 100),
          makeMeterValue('2025-05-29T12:02:00Z', 'Energy.Active.Import.Register', 150),
          makeMeterValue('2025-05-29T12:03:00Z', 'Energy.Active.Import.Register', 200),
        ];
        expect(MeterValueUtils.getTotalKwh(meterValues, 0, 50)).toBe(150); // 200 - 50 = 150
      });

      it('handles single register reading without meterStart', () => {
        const meterValues = [
          makeMeterValue('2025-05-29T12:01:00Z', 'Energy.Active.Import.Register', 100),
        ];
        expect(MeterValueUtils.getTotalKwh(meterValues, 0)).toBe(0); // 100 - 100 = 0
      });

      it('handles single register reading with meterStart', () => {
        const meterValues = [
          makeMeterValue('2025-05-29T12:01:00Z', 'Energy.Active.Import.Register', 100),
        ];
        expect(MeterValueUtils.getTotalKwh(meterValues, 0, 50)).toBe(50); // 100 - 50 = 50
      });

      it('treats missing measurand as Energy.Active.Import.Register', () => {
        const meterValues: MeterValueDto[] = [
          {
            timestamp: '2025-05-29T12:01:00Z',
            sampledValue: [{ value: 100, unitOfMeasure: { unit: 'kWh', multiplier: 0 } }],
          },
          {
            timestamp: '2025-05-29T12:02:00Z',
            sampledValue: [{ value: 200, unitOfMeasure: { unit: 'kWh', multiplier: 0 } }],
          },
        ];
        expect(MeterValueUtils.getTotalKwh(meterValues, 0)).toBe(100);
      });
    });

    describe('Interval values', () => {
      it('sums interval readings starting from currentTotal', () => {
        const meterValues = [
          makeMeterValue('2025-05-29T12:01:00Z', 'Energy.Active.Import.Interval', 50),
          makeMeterValue('2025-05-29T12:02:00Z', 'Energy.Active.Import.Interval', 49),
          makeMeterValue('2025-05-29T12:03:00Z', 'Energy.Active.Import.Interval', 46),
          makeMeterValue('2025-05-29T12:04:00Z', 'Energy.Active.Import.Interval', 52),
        ];
        expect(MeterValueUtils.getTotalKwh(meterValues, 0)).toBe(50 + 49 + 46 + 52);
      });

      it('adds interval readings to currentTotal', () => {
        const meterValues = [
          makeMeterValue('2025-05-29T12:01:00Z', 'Energy.Active.Import.Interval', 50),
          makeMeterValue('2025-05-29T12:02:00Z', 'Energy.Active.Import.Interval', 50),
        ];
        expect(MeterValueUtils.getTotalKwh(meterValues, 100)).toBe(200); // 100 + 50 + 50
      });
    });

    describe('Net values', () => {
      it('picks latest net reading', () => {
        const meterValues = [
          makeMeterValue('2025-05-29T12:01:00Z', 'Energy.Active.Net', 50),
          makeMeterValue('2025-05-29T12:02:00Z', 'Energy.Active.Net', 100),
          makeMeterValue('2025-05-29T12:03:00Z', 'Energy.Active.Net', 153),
          makeMeterValue('2025-05-29T12:04:00Z', 'Energy.Active.Net', 201),
        ];
        expect(MeterValueUtils.getTotalKwh(meterValues, 50)).toBe(201);
      });
    });

    describe('Filtering by context', () => {
      it('filters out invalid context values', () => {
        const meterValues = [
          makeMeterValue(
            '2025-05-29T12:00:00Z',
            'Energy.Active.Import.Register',
            150,
            'kWh',
            'Trigger',
          ), // Invalid context, should be filtered
          makeMeterValue(
            '2025-05-29T12:01:00Z',
            'Energy.Active.Import.Register',
            100,
            'kWh',
            'Transaction.Begin',
          ),
          makeMeterValue(
            '2025-05-29T12:03:00Z',
            'Energy.Active.Import.Register',
            200,
            'kWh',
            'Transaction.End',
          ),
        ];
        expect(MeterValueUtils.getTotalKwh(meterValues, 0)).toBe(100); // 200 - 100, ignoring 150
      });

      it('includes Sample.Periodic context', () => {
        const meterValues = [
          makeMeterValue(
            '2025-05-29T12:01:00Z',
            'Energy.Active.Import.Register',
            100,
            'kWh',
            'Transaction.Begin',
          ),
          makeMeterValue(
            '2025-05-29T12:02:00Z',
            'Energy.Active.Import.Register',
            150,
            'kWh',
            'Sample.Periodic',
          ),
        ];
        expect(MeterValueUtils.getTotalKwh(meterValues, 0)).toBe(50);
      });

      it('treats undefined context as Sample.Periodic (valid)', () => {
        const meterValues = [
          makeMeterValue('2025-05-29T12:01:00Z', 'Energy.Active.Import.Register', 100),
          makeMeterValue('2025-05-29T12:02:00Z', 'Energy.Active.Import.Register', 200),
        ];
        expect(MeterValueUtils.getTotalKwh(meterValues, 0)).toBe(100);
      });
    });

    describe('Unit normalization', () => {
      it('normalizes Wh to kWh', () => {
        const meterValues = [
          makeMeterValue('2025-05-29T12:01:00Z', 'Energy.Active.Import.Register', 1000, 'Wh'),
          makeMeterValue('2025-05-29T12:02:00Z', 'Energy.Active.Import.Register', 5000, 'Wh'),
        ];
        expect(MeterValueUtils.getTotalKwh(meterValues, 0)).toBe(4); // (5000 - 1000) / 1000
      });

      it('handles kWh without conversion', () => {
        const meterValues = [
          makeMeterValue('2025-05-29T12:01:00Z', 'Energy.Active.Import.Register', 100, 'kWh'),
          makeMeterValue('2025-05-29T12:02:00Z', 'Energy.Active.Import.Register', 150, 'kWh'),
        ];
        expect(MeterValueUtils.getTotalKwh(meterValues, 0)).toBe(50);
      });

      it('applies multiplier correctly', () => {
        const meterValues: MeterValueDto[] = [
          {
            timestamp: '2025-05-29T12:01:00Z',
            sampledValue: [
              {
                measurand: 'Energy.Active.Import.Register',
                value: 100,
                unitOfMeasure: { unit: 'Wh', multiplier: 3 }, // multiplier=3 means *1000, so 100kWh
              },
            ],
          },
          {
            timestamp: '2025-05-29T12:02:00Z',
            sampledValue: [
              {
                measurand: 'Energy.Active.Import.Register',
                value: 200,
                unitOfMeasure: { unit: 'Wh', multiplier: 3 }, // 200kWh
              },
            ],
          },
        ];
        expect(MeterValueUtils.getTotalKwh(meterValues, 0)).toBe(100); // 200kWh - 100kWh = 100kWh
      });
    });

    it('returns 0 for empty meter values', () => {
      expect(MeterValueUtils.getTotalKwh([], 0)).toBe(0);
    });

    it('returns 0 when all values have invalid contexts', () => {
      const meterValues = [
        makeMeterValue(
          '2025-05-29T12:01:00Z',
          'Energy.Active.Import.Register',
          100,
          'kWh',
          'Other',
        ),
        makeMeterValue(
          '2025-05-29T12:02:00Z',
          'Energy.Active.Import.Register',
          200,
          'kWh',
          'Other',
        ),
      ];
      expect(MeterValueUtils.getTotalKwh(meterValues, 0)).toBe(0);
    });
  });

  describe('getMeterStart', () => {
    it('returns the first register value', () => {
      const meterValues = [
        makeMeterValue('2025-05-29T12:03:00Z', 'Energy.Active.Import.Register', 300),
        makeMeterValue('2025-05-29T12:01:00Z', 'Energy.Active.Import.Register', 100),
        makeMeterValue('2025-05-29T12:02:00Z', 'Energy.Active.Import.Register', 200),
      ];
      expect(MeterValueUtils.getMeterStart(meterValues)).toBe(100);
    });

    it('returns null for empty meter values', () => {
      expect(MeterValueUtils.getMeterStart([])).toBe(null);
    });

    it('returns null when there are no register values', () => {
      const meterValues = [
        makeMeterValue('2025-05-29T12:01:00Z', 'Energy.Active.Import.Interval', 50),
        makeMeterValue('2025-05-29T12:02:00Z', 'Energy.Active.Import.Interval', 60),
      ];
      expect(MeterValueUtils.getMeterStart(meterValues)).toBe(null);
    });

    it('returns null when all values have invalid contexts', () => {
      const meterValues = [
        makeMeterValue(
          '2025-05-29T12:01:00Z',
          'Energy.Active.Import.Register',
          100,
          'kWh',
          'Other',
        ),
      ];
      expect(MeterValueUtils.getMeterStart(meterValues)).toBe(null);
    });

    it('normalizes units when getting meter start', () => {
      const meterValues = [
        makeMeterValue('2025-05-29T12:01:00Z', 'Energy.Active.Import.Register', 5000, 'Wh'),
        makeMeterValue('2025-05-29T12:02:00Z', 'Energy.Active.Import.Register', 10000, 'Wh'),
      ];
      expect(MeterValueUtils.getMeterStart(meterValues)).toBe(5); // 5000 Wh = 5 kWh
    });
  });

  describe('Phased values', () => {
    it('sums L1, L2, L3 phased values for register measurand', () => {
      const meterValues: MeterValueDto[] = [
        {
          timestamp: '2025-05-29T12:01:00Z',
          sampledValue: [
            {
              measurand: 'Energy.Active.Import.Register',
              phase: 'L1',
              value: 10,
              unitOfMeasure: { unit: 'kWh', multiplier: 0 },
            },
            {
              measurand: 'Energy.Active.Import.Register',
              phase: 'L2',
              value: 20,
              unitOfMeasure: { unit: 'kWh', multiplier: 0 },
            },
            {
              measurand: 'Energy.Active.Import.Register',
              phase: 'L3',
              value: 30,
              unitOfMeasure: { unit: 'kWh', multiplier: 0 },
            },
          ],
        },
        {
          timestamp: '2025-05-29T12:02:00Z',
          sampledValue: [
            {
              measurand: 'Energy.Active.Import.Register',
              phase: 'L1',
              value: 20,
              unitOfMeasure: { unit: 'kWh', multiplier: 0 },
            },
            {
              measurand: 'Energy.Active.Import.Register',
              phase: 'L2',
              value: 40,
              unitOfMeasure: { unit: 'kWh', multiplier: 0 },
            },
            {
              measurand: 'Energy.Active.Import.Register',
              phase: 'L3',
              value: 60,
              unitOfMeasure: { unit: 'kWh', multiplier: 0 },
            },
          ],
        },
      ];
      // First reading: 10 + 20 + 30 = 60
      // Second reading: 20 + 40 + 60 = 120
      // Difference: 120 - 60 = 60
      expect(MeterValueUtils.getTotalKwh(meterValues, 0)).toBe(60);
    });

    it('falls back to L1-N, L2-N, L3-N phased values', () => {
      const meterValues: MeterValueDto[] = [
        {
          timestamp: '2025-05-29T12:01:00Z',
          sampledValue: [
            {
              measurand: 'Energy.Active.Import.Register',
              phase: 'L1-N',
              value: 10,
              unitOfMeasure: { unit: 'kWh', multiplier: 0 },
            },
            {
              measurand: 'Energy.Active.Import.Register',
              phase: 'L2-N',
              value: 20,
              unitOfMeasure: { unit: 'kWh', multiplier: 0 },
            },
            {
              measurand: 'Energy.Active.Import.Register',
              phase: 'L3-N',
              value: 30,
              unitOfMeasure: { unit: 'kWh', multiplier: 0 },
            },
          ],
        },
        {
          timestamp: '2025-05-29T12:02:00Z',
          sampledValue: [
            {
              measurand: 'Energy.Active.Import.Register',
              phase: 'L1-N',
              value: 50,
              unitOfMeasure: { unit: 'kWh', multiplier: 0 },
            },
            {
              measurand: 'Energy.Active.Import.Register',
              phase: 'L2-N',
              value: 60,
              unitOfMeasure: { unit: 'kWh', multiplier: 0 },
            },
            {
              measurand: 'Energy.Active.Import.Register',
              phase: 'L3-N',
              value: 70,
              unitOfMeasure: { unit: 'kWh', multiplier: 0 },
            },
          ],
        },
      ];
      // First: 10 + 20 + 30 = 60, Second: 50 + 60 + 70 = 180
      expect(MeterValueUtils.getTotalKwh(meterValues, 0)).toBe(120); // 180 - 60
    });
  });
});
