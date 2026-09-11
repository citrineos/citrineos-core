// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { RedactionRule } from '@citrineos/base';
import { OCPP2_0_1, OCPP2_1 } from '@citrineos/types';

const KEY_CODE_TYPES: readonly string[] = [
  OCPP2_0_1.IdTokenEnumType.KeyCode,
  OCPP2_1.IdTokenEnumType.KeyCode,
];

/**
 * Redacts the `idToken` of any OCPP idToken object whose `type` is `KeyCode`.
 *
 * OCPP 2.x C04.FR.04: "If an idToken of type keyCode is used - The Charging Station or CSMS SHALL
 * NOT show the IdToken in any logging." A key code is the PIN a driver typed at the Charging
 * Station, so unlike the other idToken types it is a secret rather than an identifier.
 *
 * This has to be a rule rather than a masked key name because `idToken` is only sometimes a secret:
 * the same field holds a public tag id for an `ISO14443` token and a PIN for a `KeyCode` one. What
 * distinguishes them is the sibling `type`, which only something looking at the whole object can
 * see. Applying it as middleware on the root logger is what makes it hold everywhere a key code
 * could reach a log — the handler that received it, the router that logged the raw message, an
 * error path nobody thought about — rather than at the call sites someone remembered to change.
 *
 * @param placeholder - what to write in place of the key code.
 */
export function keyCodeRedactionRule(placeholder: string): RedactionRule {
  return (node) =>
    typeof node.type === 'string' &&
    KEY_CODE_TYPES.includes(node.type) &&
    typeof node.idToken === 'string'
      ? { idToken: placeholder }
      : undefined;
}
