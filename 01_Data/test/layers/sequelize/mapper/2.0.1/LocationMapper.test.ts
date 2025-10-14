// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { ConnectorStatus, OCPP2_0_1 } from '@citrineos/base';
import { LocationMapper } from '../../../../../src/layers/sequelize/mapper/2.0.1';

describe('LocationMapper', () => {
  describe('mapConnectorStatus', () => {
    it('should correctly map all ConnectorStatusEnumType values', () => {
      const testCases = [
        {
          input: OCPP2_0_1.ConnectorStatusEnumType.Available,
          expected: ConnectorStatus.Available,
        },
        {
          input: OCPP2_0_1.ConnectorStatusEnumType.Occupied,
          expected: ConnectorStatus.Charging,
        },
        {
          input: OCPP2_0_1.ConnectorStatusEnumType.Reserved,
          expected: ConnectorStatus.Reserved,
        },
        {
          input: OCPP2_0_1.ConnectorStatusEnumType.Unavailable,
          expected: ConnectorStatus.Unavailable,
        },
        {
          input: OCPP2_0_1.ConnectorStatusEnumType.Faulted,
          expected: ConnectorStatus.Faulted,
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
      expect(result).toBe(ConnectorStatus.Unknown);
    });
  });
});
