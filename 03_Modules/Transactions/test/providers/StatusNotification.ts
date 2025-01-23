import {
  OCPP2_0_1
} from '@citrineos/base';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { MOCK_CONNECTOR_ID, MOCK_EVSE_ID } from './DeviceModelProvider';
import { StatusNotification } from '@citrineos/data';

export function aStatusNotificationRequest(
  updateFunction?: UpdateFunction<OCPP2_0_1.StatusNotificationRequest>,
): OCPP2_0_1.StatusNotificationRequest {
  const request: OCPP2_0_1.StatusNotificationRequest = {
    timestamp: new Date().toISOString(),
    connectorStatus: OCPP2_0_1.ConnectorStatusEnumType.Available,
    evseId: MOCK_EVSE_ID,
    connectorId: MOCK_CONNECTOR_ID,
  } as OCPP2_0_1.StatusNotificationRequest;

  return applyUpdateFunction(request, updateFunction);
}

export function aStatusNotification(
  updateFunction?: UpdateFunction<StatusNotification>,
) : StatusNotification {
  const statusNotification: StatusNotification = {
    timestamp: new Date().toISOString(),
    connectorStatus: OCPP2_0_1.ConnectorStatusEnumType.Available,
    evseId: MOCK_EVSE_ID,
    connectorId: MOCK_CONNECTOR_ID,
  } as StatusNotification;

  return applyUpdateFunction(statusNotification, updateFunction);
}