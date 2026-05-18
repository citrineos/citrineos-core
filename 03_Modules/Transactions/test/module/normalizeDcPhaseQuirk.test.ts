// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from 'vitest';
import { normalizeDcPhaseQuirk } from '../../src/module/module.js';

describe('normalizeDcPhaseQuirk', () => {
  it('strips phase="L1" when only L1 present (Ruisu DC charger quirk)', () => {
    // Captured payload from e_nyamirambo_1 / e_kibagabaga_1
    const meterValue = {
      timestamp: '2026-05-12T10:24:46.974Z',
      sampledValue: [
        { measurand: 'Energy.Active.Import.Register', value: '59331693', unit: 'Wh', phase: 'N' },
        { measurand: 'Voltage', value: '362.6', unit: 'V', phase: 'L1' },
        { measurand: 'Current.Import', value: '246.6', unit: 'A', phase: 'L1' },
        { measurand: 'Power.Active.Import', value: '89417.2', unit: 'W', phase: 'L1' },
        { measurand: 'SoC', value: '30', unit: 'Percent', phase: 'N' },
      ],
    } as any;

    normalizeDcPhaseQuirk(meterValue);

    // V/A/W L1 tags removed
    expect(meterValue.sampledValue[1].phase).toBeUndefined();
    expect(meterValue.sampledValue[2].phase).toBeUndefined();
    expect(meterValue.sampledValue[3].phase).toBeUndefined();
    // Energy and SoC N tags preserved (overall reading)
    expect(meterValue.sampledValue[0].phase).toBe('N');
    expect(meterValue.sampledValue[4].phase).toBe('N');
    // Values untouched
    expect(meterValue.sampledValue[1].value).toBe('362.6');
    expect(meterValue.sampledValue[2].value).toBe('246.6');
    expect(meterValue.sampledValue[3].value).toBe('89417.2');
  });

  it('preserves L1 when L2 or L3 also present (real AC 3-phase charger)', () => {
    const meterValue = {
      timestamp: '2026-05-12T10:24:46Z',
      sampledValue: [
        { measurand: 'Voltage', value: '230', unit: 'V', phase: 'L1' },
        { measurand: 'Voltage', value: '232', unit: 'V', phase: 'L2' },
        { measurand: 'Voltage', value: '229', unit: 'V', phase: 'L3' },
        { measurand: 'Voltage', value: '230.3', unit: 'V', phase: 'N' },
      ],
    } as any;

    normalizeDcPhaseQuirk(meterValue);

    // All phases preserved — real per-phase data
    expect(meterValue.sampledValue[0].phase).toBe('L1');
    expect(meterValue.sampledValue[1].phase).toBe('L2');
    expect(meterValue.sampledValue[2].phase).toBe('L3');
    expect(meterValue.sampledValue[3].phase).toBe('N');
  });

  it('leaves payload untouched when no phase field present (Kanombe-style)', () => {
    const meterValue = {
      timestamp: '2026-05-12T08:07:08Z',
      sampledValue: [
        { measurand: 'Energy.Active.Import.Register', value: '12324412', unit: 'Wh' },
        { measurand: 'Voltage', value: '585.70', unit: 'V' },
        { measurand: 'Current.Import', value: '136.90', unit: 'A' },
        { measurand: 'Power.Active.Import', value: '80182.33', unit: 'W' },
      ],
    } as any;

    normalizeDcPhaseQuirk(meterValue);

    meterValue.sampledValue.forEach((s: any) => expect(s.phase).toBeUndefined());
  });

  it('leaves payload untouched when uniform phase="N" (Kacyiru-style)', () => {
    const meterValue = {
      timestamp: '2026-05-12T10:25:24.226Z',
      sampledValue: [
        { measurand: 'Energy.Active.Import.Register', value: '148607398', unit: 'Wh', phase: 'N' },
        { measurand: 'Voltage', value: '440.9', unit: 'V', phase: 'N' },
        { measurand: 'Current.Import', value: '224.1', unit: 'A', phase: 'N' },
        { measurand: 'Power.Active.Import', value: '98805.7', unit: 'W', phase: 'N' },
        { measurand: 'SoC', value: '51', unit: 'Percent', phase: 'N' },
      ],
    } as any;

    normalizeDcPhaseQuirk(meterValue);

    meterValue.sampledValue.forEach((s: any) => expect(s.phase).toBe('N'));
  });

  it('handles empty sampledValue array without error', () => {
    const meterValue = { timestamp: '2026-05-12T10:24:46Z', sampledValue: [] } as any;
    expect(() => normalizeDcPhaseQuirk(meterValue)).not.toThrow();
  });
});
