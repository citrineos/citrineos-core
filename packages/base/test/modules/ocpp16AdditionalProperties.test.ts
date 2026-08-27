// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { OCPP1_6_CALL_RESULT_SCHEMA_RECORD, OCPP1_6_CALL_SCHEMA_RECORD } from '../../index.js';
import { OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import { OCPPValidator } from '@interfaces/modules/OCPPValidator.js';

/**
 * OCPP-J 1.6 errata, §3.2 "JSON Schema files do allow for extra fields within inner objects":
 *
 *   "It is not allowed to add extra fields/values to OCPP messages, this could cause
 *    interoperability issues in the field. The WSDL files are correct, the original JSON Schema
 *    files allow extra fields on inner objects and extra values on enums, which was not intended.
 *    Most of the JSON Schema files have been updated to fix this. The line: "additionalProperties":
 *    false has been added to the definition of all object and enum definitions."
 *
 * Unlike OCPP 2.x there is no customData extension point in 1.6, so a class is simply closed.
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
    if (node.additionalProperties !== false) {
      open.push(`${path} (additionalProperties: ${JSON.stringify(node.additionalProperties)})`);
    }
  });
  return open;
}

describe('OCPP 1.6 schemas are closed', () => {
  const records: [string, Record<string, object>][] = [
    ['call', OCPP1_6_CALL_SCHEMA_RECORD],
    ['call result', OCPP1_6_CALL_RESULT_SCHEMA_RECORD],
  ];

  for (const [label, record] of records) {
    it(`every ${label} schema closes every class`, () => {
      const open = Object.entries(record).flatMap(([action, schema]) =>
        openObjects(schema as Schema, action),
      );

      expect(open).toEqual([]);
    });
  }

  it('refuses a property the message definition does not have', () => {
    const result = new OCPPValidator().validateOCPPRequest(
      OCPP_CallAction.Authorize,
      { idTag: 'TAG01', notAField: 1 },
      OCPPVersion.OCPP1_6,
    );

    expect(result.isValid).toBe(false);
  });

  it('refuses a property inside an inner object, which is what the erratum is about', () => {
    const result = new OCPPValidator().validateOCPPRequest(
      OCPP_CallAction.MeterValues,
      {
        connectorId: 1,
        meterValue: [
          {
            timestamp: '2026-08-27T10:00:00.000Z',
            sampledValue: [{ value: '1', notAField: 1 }],
          },
        ],
      },
      OCPPVersion.OCPP1_6,
    );

    expect(result.isValid).toBe(false);
  });

  it('still accepts a message that only uses fields the definition has', () => {
    const result = new OCPPValidator().validateOCPPRequest(
      OCPP_CallAction.Authorize,
      { idTag: 'TAG01' },
      OCPPVersion.OCPP1_6,
    );

    expect(result.errors ?? []).toEqual([]);
    expect(result.isValid).toBe(true);
  });
});
