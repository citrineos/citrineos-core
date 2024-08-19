import { applyUpdateFunction, UpdateFunction } from '../utils/UpdateUtil';
import { IMessageConfirmation } from '@citrineos/base';

const MOCK_PAYLOAD = 'Payload';
export const MOCK_REQUEST_ID = 1;

export const aMessageConfirmation = (
  updateFunction?: UpdateFunction<IMessageConfirmation>,
): IMessageConfirmation => {
  const confirmation: IMessageConfirmation = {
    success: true,
    payload: MOCK_PAYLOAD,
  };

  return applyUpdateFunction(confirmation, updateFunction);
};
