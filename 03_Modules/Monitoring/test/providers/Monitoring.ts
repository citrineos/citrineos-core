import { OCPP2_0_1 } from '@citrineos/base';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';

export const aClearMonitoringResult = (
  updateFunction?: UpdateFunction<OCPP2_0_1.ClearMonitoringResultType>,
): OCPP2_0_1.ClearMonitoringResultType => {
  const clear = {
    status: OCPP2_0_1.ClearMonitoringStatusEnumType.Accepted,
    id: Math.floor(Math.random() * 1000),
  };

  return applyUpdateFunction(clear, updateFunction);
};
