// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type IMessageConfirmation } from '@citrineos/base';
import { applyUpdateFunction, type UpdateFunction } from '../utils/UpdateUtil.js';

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
