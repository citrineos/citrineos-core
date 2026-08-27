// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { OCPP2_0_1_CALL_RESULT_SCHEMA_RECORD, OCPP2_0_1_CALL_SCHEMA_RECORD } from '../../index.js';
import { OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { OCPPValidator } from '@interfaces/modules/OCPPValidator.js';

/**
 * OCPP 2.0.1 Edition 4, Part 4 - JSON over WebSockets, Chapter 9 CustomData Extension:
 *
 *   "In the JSON schema files all classes have the attribute additionalProperties set to false,
 *    such that a JSON parser will not accept any other properties in the message. In order to allow
 *    for some flexibility to create non-standard extensions for experimentation purposes, every
 *    JSON class has been extended with a "customData" property. This property is of type
 *    "CustomDataType", which has only one required property: "vendorId" ... However, since it does
 *    not have additionalProperties set to false it can be freely extended with new properties."
 *
 * So every class is closed and customData is the one way in. CustomDataType itself is the single
 * exception, and it carries no additionalProperties at all.
 */
type Schema = Record<string, unknown>;

function walk(node: unknown, path: string, visit: (node: Schema, path: string) => void): void {
  if (Array.isArray(node)) {
    node.forEach((child, i) => walk(child, `${path}[${i}]`, visit));
    return;
  }
  if (node === null || typeof node !== 'object') {
    return;
  }
  const schema = node as Schema;
  if (schema.type === 'object') {
    visit(schema, path);
  }
  for (const [key, value] of Object.entries(schema)) {
    walk(value, `${path}.${key}`, visit);
  }
}

function openObjects(schema: Schema, name: string): string[] {
  const open: string[] = [];
  walk(schema, name, (node, path) => {
    // CustomDataType is deliberately open; it is the extension point the chapter describes.
    if (path.endsWith('.CustomDataType')) {
      return;
    }
    if (node.additionalProperties !== false) {
      open.push(`${path} (additionalProperties: ${JSON.stringify(node.additionalProperties)})`);
    }
  });
  return open;
}

describe('OCPP 2.0.1 schemas are closed', () => {
  const records: [string, Record<string, object>][] = [
    ['call', OCPP2_0_1_CALL_SCHEMA_RECORD],
    ['call result', OCPP2_0_1_CALL_RESULT_SCHEMA_RECORD],
  ];

  for (const [label, record] of records) {
    it(`every ${label} schema closes every class except CustomDataType`, () => {
      const open = Object.entries(record).flatMap(([action, schema]) =>
        openObjects(schema as Schema, action),
      );

      expect(open).toEqual([]);
    });
  }

  it('refuses a property the message definition does not have', () => {
    const result = new OCPPValidator().validateOCPPRequest(
      OCPP_CallAction.Heartbeat,
      { notAField: 1 },
      OCPPVersion.OCPP2_0_1,
    );

    expect(result.isValid).toBe(false);
  });

  it('still accepts a vendor extension under customData', () => {
    const result = new OCPPValidator().validateOCPPRequest(
      OCPP_CallAction.Heartbeat,
      { customData: { vendorId: 'org.example', mainMeter: 1234 } },
      OCPPVersion.OCPP2_0_1,
    );

    expect(result.isValid).toBe(true);
  });
});
