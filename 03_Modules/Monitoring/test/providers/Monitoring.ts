import {
  ClearMonitoringResultType,
  ClearMonitoringStatusEnumType,
} from '@citrineos/base';
import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';

export const aClearMonitoringResult = (
  updateFunction?: UpdateFunction<ClearMonitoringResultType>,
): ClearMonitoringResultType => {
  const clear = {
    status: ClearMonitoringStatusEnumType.Accepted,
    id: Math.floor(Math.random() * 1000),
  };

  return applyUpdateFunction(clear, updateFunction);
};
