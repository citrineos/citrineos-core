import { expect } from '@jest/globals';
import { StatusNotificationMapper } from '../../../../../src/layers/sequelize/mapper/2.0.1';
import { aStatusNotification } from '../../../../providers/StatusNotification';

describe('StatusNotification', () => {
  describe('map StatusNotification and StatusNotificationMapper', () => {
    it('should map between StatusNotification and StatusNotificationMapper successfully', () => {
      const givenStatusNotification = aStatusNotification();

      const actualMapper = new StatusNotificationMapper(givenStatusNotification);
      expect(actualMapper).toBeTruthy();
      expect(actualMapper.timestamp).toBe(givenStatusNotification.timestamp);
      expect(actualMapper.connectorStatus).toEqual(givenStatusNotification.connectorStatus);
      expect(actualMapper.evseId).toBe(givenStatusNotification.evseId);
      expect(actualMapper.connectorId).toBe(givenStatusNotification.connectorId);
      expect(actualMapper.customData).toEqual(givenStatusNotification.customData);
      expect(actualMapper.stationId).toBe(givenStatusNotification.stationId);

      const actualModel = actualMapper.toModel();
      expect(actualModel).toBeTruthy();
      expect(actualModel.timestamp).toBe(givenStatusNotification.timestamp);
      expect(actualModel.connectorStatus).toBe(givenStatusNotification.connectorStatus);
      expect(actualModel.evseId).toBe(givenStatusNotification.evseId);
      expect(actualModel.connectorId).toBe(givenStatusNotification.connectorId);
      expect(actualModel.customData).toBe(givenStatusNotification.customData);
      expect(actualModel.stationId).toBe(givenStatusNotification.stationId);
    });

    it('should throw error when missing required fields', () => {
      const statusNotificationMissingTimestamp = aStatusNotification((s) => (s.timestamp = undefined));
      expect(() => new StatusNotificationMapper(statusNotificationMissingTimestamp)).toThrowError(`Validation failed: [{"property":"timestamp","children":[],"constraints":{"isNotEmpty":"timestamp should not be empty"}}]`);

      const statusNotificationMissingEvseId = aStatusNotification((s) => (s.evseId = undefined));
      expect(() => new StatusNotificationMapper(statusNotificationMissingEvseId)).toThrowError(
        'Validation failed: [{"property":"evseId","children":[],"constraints":{"isNotEmpty":"evseId should not be empty","isInt":"evseId must be an integer number"}}]',
      );
    });

    it('should throw error with invalid values', () => {
      const statusNotificationInvalidConnectorStatus = aStatusNotification((s) => (s.connectorStatus = 'Invalid'));
      expect(() => new StatusNotificationMapper(statusNotificationInvalidConnectorStatus)).toThrowError(
        `Validation failed: [{"value":"Invalid","property":"connectorStatus","children":[],"constraints":{"isEnum":"connectorStatus must be one of the following values: Available, Occupied, Reserved, Unavailable, Faulted"}}]`,
      );
    });
  });
});
