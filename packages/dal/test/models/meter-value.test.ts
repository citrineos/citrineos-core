// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { SystemConfig } from '@citrineos/types';
import { beforeAll, describe, expect, it } from 'vitest';
import { DefaultSequelizeInstance, MeterValue } from '../../index.js';

beforeAll(() => {
  DefaultSequelizeInstance.getInstance({
    database: { dialect: 'postgres', host: 'localhost', port: 5432, database: 'unused' },
  } as unknown as SystemConfig);
});

describe('MeterValue', () => {
  describe('timestamp', () => {
    it('should be undefined when no timestamp is set', () => {
      const meterValue = MeterValue.build({ sampledValue: [{ value: 1 }] });

      expect(meterValue.timestamp).toBeUndefined();
    });

    it('should return the stored date as an ISO string', () => {
      const meterValue = MeterValue.build({ timestamp: '2026-09-11T10:00:00+01:00' });

      expect(meterValue.timestamp).toBe('2026-09-11T09:00:00.000Z');
    });
  });
});
