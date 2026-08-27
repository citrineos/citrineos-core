// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IdTokenEnum, type IdTokenEnumType } from '@citrineos/types';

export const REDACTED_KEY_CODE = '[redacted key code]';

export function isKeyCode(type: IdTokenEnumType | string | undefined): boolean {
  return type === IdTokenEnum.KeyCode;
}

export function redactKeyCode(type: IdTokenEnumType | string | undefined, idToken: string): string {
  return isKeyCode(type) ? REDACTED_KEY_CODE : idToken;
}

export function redactKeyCodeInMessage<T>(message: T): T {
  const payload = (message as { payload?: { idToken?: { idToken?: string; type?: string } } })
    ?.payload;
  const idToken = payload?.idToken;
  if (!idToken || !isKeyCode(idToken.type)) {
    return message;
  }
  return {
    ...message,
    payload: { ...payload, idToken: { ...idToken, idToken: REDACTED_KEY_CODE } },
  } as T;
}
