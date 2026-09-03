// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { IdTokenEnum, type IdTokenEnumType } from '@citrineos/types';

export const REDACTED_KEY_CODE = '[redacted key code]';

/**
 * C04.FR.04: "If an idToken of type keyCode is used - The Charging Station or CSMS SHALL NOT show
 * the IdToken in any logging. key codes should never appear in logs."
 *
 * A key code is a PIN the driver typed at the Charging Station, so it is the one idToken type the
 * spec singles out. Everything that would otherwise put a whole AuthorizeRequest or its idToken in
 * front of the logger goes through here first.
 */
export function isKeyCode(type: IdTokenEnumType | string | undefined): boolean {
  return type === IdTokenEnum.KeyCode;
}

/**
 * Returns the token value if it is safe to log, and a placeholder if it is a key code.
 */
export function redactKeyCode(type: IdTokenEnumType | string | undefined, idToken: string): string {
  return isKeyCode(type) ? REDACTED_KEY_CODE : idToken;
}

/**
 * Returns a copy of a message whose payload carries an idToken, with a key code replaced by a
 * placeholder. Anything else is returned unchanged, so the common path allocates nothing.
 */
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
