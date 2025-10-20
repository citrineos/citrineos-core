// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { ConnectorStatus } from '@citrineos/base';
import { OCPP2_0_1 } from '@citrineos/base';
import { LocationMapper } from '../../../../../src/layers/sequelize/mapper/2.0.1';
import { describe, expect, it } from 'vitest';

describe('LocationMapper', () => {
  describe('mapConnectorStatus', () => {
    it('should correctly map all ConnectorStatusEnumType values', () => {
      const testCases = [
        {
          input: OCPP2_0_1.ConnectorStatusEnumType.Available,
          expected: 'Available',
        },
        {
          input: OCPP2_0_1.ConnectorStatusEnumType.Occupied,
          expected: 'Charging',
        },
        {
          input: OCPP2_0_1.ConnectorStatusEnumType.Reserved,
          expected: 'Reserved',
        },
        {
          input: OCPP2_0_1.ConnectorStatusEnumType.Unavailable,
          expected: 'Unavailable',
        },
        {
          input: OCPP2_0_1.ConnectorStatusEnumType.Faulted,
          expected: 'Faulted',
        },
      ];

      testCases.forEach(({ input, expected }) => {
        const result = LocationMapper.mapConnectorStatus(input);
        expect(result).toBe(expected);
      });
    });

    it('should return Unknown for an unknown status', () => {
      const result = LocationMapper.mapConnectorStatus(
        'InvalidStatus' as OCPP2_0_1.ConnectorStatusEnumType,
      );
      expect(result).toBe('Unknown');
    });
  });
});
