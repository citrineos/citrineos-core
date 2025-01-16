import { expect } from '@jest/globals';
import { StatusNotificationMapper } from '../../../../../src/layers/sequelize/mapper/1.6';
import { aStatusNotification } from '../../../../providers/StatusNotification';

describe('StatusNotification', () => {
  describe('map StatusNotification and StatusNotificationMapper', () => {
    it('should map between StatusNotification and StatusNotificationMapper successfully', () => {
      const givenStatusNotification = aStatusNotification();

      const actualMapper = new StatusNotificationMapper(givenStatusNotification);
      expect(actualMapper).toBeTruthy();
      expect(actualMapper.timestamp).toBe(givenStatusNotification.timestamp);
      expect(actualMapper.status).toEqual(givenStatusNotification.chargePointStatus);
      expect(actualMapper.connectorId).toBe(givenStatusNotification.connectorId);
      expect(actualMapper.stationId).toBe(givenStatusNotification.stationId);
      expect(actualMapper.errorCode).toEqual(givenStatusNotification.errorCode);
      expect(actualMapper.info).toBe(givenStatusNotification.info);
      expect(actualMapper.vendorId).toBe(givenStatusNotification.vendorId);
      expect(actualMapper.vendorErrorCode).toBe(givenStatusNotification.vendorErrorCode);

      const actualModel = actualMapper.toModel();
      expect(actualModel).toBeTruthy();
      expect(actualModel.timestamp).toBe(givenStatusNotification.timestamp);
      expect(actualModel.chargePointStatus).toBe(givenStatusNotification.chargePointStatus);
      expect(actualModel.connectorId).toBe(givenStatusNotification.connectorId);
      expect(actualModel.stationId).toBe(givenStatusNotification.stationId);
      expect(actualModel.errorCode).toBe(givenStatusNotification.errorCode);
      expect(actualModel.info).toBe(givenStatusNotification.info);
      expect(actualModel.vendorId).toBe(givenStatusNotification.vendorId);
      expect(actualModel.vendorErrorCode).toBe(givenStatusNotification.vendorErrorCode);
    });

    it('should throw error when missing required fields', () => {
      const statusNotificationMissingErrorCode = aStatusNotification((s) => (s.errorCode = null));
      expect(() => new StatusNotificationMapper(statusNotificationMissingErrorCode)).toThrowError(
        `Validation failed: [{"value":null,"property":"errorCode","children":[],"constraints":{"isEnum":"errorCode must be one of the following values: ConnectorLockFailure, EVCommunicationError, GroundFailure, HighTemperature, InternalError, LocalListConflict, NoError, OtherError, OverCurrentFailure, PowerMeterFailure, PowerSwitchFailure, ReaderFailure, ResetFailure, UnderVoltage, OverVoltage, WeakSignal","isNotEmpty":"errorCode should not be empty"}}]`,
      );
    });

    it('should throw error with invalid values', () => {
      const statusNotificationInvalidChargePointStatus = aStatusNotification((s) => (s.chargePointStatus = 'InvalidCP'));
      expect(() => new StatusNotificationMapper(statusNotificationInvalidChargePointStatus)).toThrowError(
        `Validation failed: [{"value":"InvalidCP","property":"status","children":[],"constraints":{"isEnum":"status must be one of the following values: Available, Preparing, Charging, SuspendedEVSE, SuspendedEV, Finishing, Reserved, Unavailable, Faulted"}}]`,
      );

      const statusNotificationInvalidErrorCode = aStatusNotification((s) => (s.errorCode = 'InvalidErrorCode'));
      expect(() => new StatusNotificationMapper(statusNotificationInvalidErrorCode)).toThrowError(
        `Validation failed: [{"value":"InvalidErrorCode","property":"errorCode","children":[],"constraints":{"isEnum":"errorCode must be one of the following values: ConnectorLockFailure, EVCommunicationError, GroundFailure, HighTemperature, InternalError, LocalListConflict, NoError, OtherError, OverCurrentFailure, PowerMeterFailure, PowerSwitchFailure, ReaderFailure, ResetFailure, UnderVoltage, OverVoltage, WeakSignal"}}]`,
      );
    });
  });
});
