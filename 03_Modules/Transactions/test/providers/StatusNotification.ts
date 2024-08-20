import {
  ConnectorStatusEnumType,
  StatusNotificationRequest,
} from '@citrineos/base';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { MOCK_CONNECTOR_ID, MOCK_EVSE_ID } from './DeviceModelProvider';

export function aStatusNotificationRequest(
  updateFunction?: UpdateFunction<StatusNotificationRequest>,
): StatusNotificationRequest {
  const request: StatusNotificationRequest = {
    timestamp: new Date().toISOString(),
    connectorStatus: ConnectorStatusEnumType.Available,
    evseId: MOCK_EVSE_ID,
    connectorId: MOCK_CONNECTOR_ID,
  } as StatusNotificationRequest;

  return applyUpdateFunction(request, updateFunction);
}
