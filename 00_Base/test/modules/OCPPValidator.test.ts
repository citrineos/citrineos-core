// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Ajv } from 'ajv';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  OCPP1_6_CALL_RESULT_SCHEMA_MAP,
  OCPP1_6_CALL_SCHEMA_MAP,
  OCPP1_6_CallAction,
  OCPP2_0_1_CALL_RESULT_SCHEMA_MAP,
  OCPP2_0_1_CALL_SCHEMA_MAP,
  OCPP2_0_1_CallAction,
  OCPPVersion,
} from '../../src/index.js';
import { OCPPValidator } from '../../src/interfaces/modules/OCPPValidator.js';

describe('OCPPValidator', () => {
  let validator: OCPPValidator;

  beforeEach(() => {
    validator = new OCPPValidator();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create an instance with default ajv and logger', () => {
      const instance = new OCPPValidator();
      expect(instance).toBeInstanceOf(OCPPValidator);
    });

    it('should accept a custom Ajv instance', () => {
      const customAjv = new Ajv();
      const instance = new OCPPValidator(undefined, customAjv);
      expect(instance).toBeInstanceOf(OCPPValidator);
    });
  });

  describe('createServerAjvInstance', () => {
    it('should create a new Ajv instance when none is provided', () => {
      const ajv = OCPPValidator.createServerAjvInstance();
      expect(ajv).toBeInstanceOf(Ajv);
    });

    it('should use the provided Ajv instance', () => {
      const customAjv = new Ajv({ strict: false });
      const result = OCPPValidator.createServerAjvInstance(customAjv);
      expect(result).toBe(customAjv);
    });

    it('should add OCPP keywords to the instance', () => {
      const ajv = OCPPValidator.createServerAjvInstance();
      // Verify schema with custom keywords compiles without error
      const schema = {
        type: 'object',
        comment: 'A test comment',
        javaType: 'com.example.Test',
        tsEnumNames: ['A', 'B'],
        properties: { id: { type: 'string' } },
      };
      expect(() => ajv.compile(schema)).not.toThrow();
    });
  });

  describe('createValidatorAjvInstance', () => {
    it('should create a new Ajv instance when none is provided', () => {
      const ajv = OCPPValidator.createValidatorAjvInstance();
      expect(ajv).toBeInstanceOf(Ajv);
    });

    it('should return the provided Ajv instance unchanged', () => {
      const customAjv = new Ajv({ strict: false });
      const result = OCPPValidator.createValidatorAjvInstance(customAjv);
      expect(result).toBe(customAjv);
    });
  });

  describe('addOcppKeywords', () => {
    it('should add comment, javaType, and tsEnumNames keywords', () => {
      const ajv = new Ajv({ strict: false });
      OCPPValidator.addOcppKeywords(ajv);

      const schema = {
        type: 'object',
        comment: 'Test comment',
        javaType: 'com.test.Type',
        tsEnumNames: ['Value1'],
        properties: { name: { type: 'string' } },
      };

      const validate = ajv.compile(schema);
      expect(validate({ name: 'test' })).toBe(true);
    });
  });

  describe('addFormats', () => {
    it('should add date-time and uri formats', () => {
      const ajv = new Ajv({ strict: false });
      OCPPValidator.addFormats(ajv);

      const dateTimeSchema = { type: 'string', format: 'date-time' };
      const validateDateTime = ajv.compile(dateTimeSchema);
      expect(validateDateTime('2024-01-01T00:00:00Z')).toBe(true);
      expect(validateDateTime('not-a-date')).toBe(false);

      const uriSchema = { type: 'string', format: 'uri' };
      const validateUri = ajv.compile(uriSchema);
      expect(validateUri('https://example.com')).toBe(true);
    });
  });

  describe('validateOCPPRequest', () => {
    describe('OCPP 1.6', () => {
      it('should validate a valid BootNotification request', () => {
        const payload = {
          chargePointModel: 'TestModel',
          chargePointVendor: 'TestVendor',
        };

        const result = validator.validateOCPPRequest(
          OCPP1_6_CallAction.BootNotification,
          payload,
          OCPPVersion.OCPP1_6,
        );

        expect(result.isValid).toBe(true);
        expect(result.errors).toBeUndefined();
      });

      it('should return invalid for a malformed request', () => {
        const payload = {
          // missing required chargePointModel and chargePointVendor
        };

        const result = validator.validateOCPPRequest(
          OCPP1_6_CallAction.BootNotification,
          payload,
          OCPPVersion.OCPP1_6,
        );

        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.length).toBeGreaterThan(0);
      });

      it('should validate a valid Heartbeat request', () => {
        const result = validator.validateOCPPRequest(
          OCPP1_6_CallAction.Heartbeat,
          {},
          OCPPVersion.OCPP1_6,
        );

        expect(result.isValid).toBe(true);
      });

      it('should validate a valid Authorize request', () => {
        const payload = {
          idTag: 'TESTIDTAG001',
        };

        const result = validator.validateOCPPRequest(
          OCPP1_6_CallAction.Authorize,
          payload,
          OCPPVersion.OCPP1_6,
        );

        expect(result.isValid).toBe(true);
      });

      it('should return invalid for Authorize request missing idTag', () => {
        const result = validator.validateOCPPRequest(
          OCPP1_6_CallAction.Authorize,
          {},
          OCPPVersion.OCPP1_6,
        );

        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });

    describe('OCPP 2.0.1', () => {
      it('should validate a valid Heartbeat request', () => {
        const result = validator.validateOCPPRequest(
          OCPP2_0_1_CallAction.Heartbeat,
          {},
          OCPPVersion.OCPP2_0_1,
        );

        expect(result.isValid).toBe(true);
      });
    });

    describe('OCPP 2.0.1', () => {
      it('should validate a valid RequestStartTransaction request', () => {
        const result = validator.validateOCPPRequest(
          OCPP2_0_1_CallAction.RequestStartTransaction,
          {
            remoteStartId: 0,
            evseId: 1,
            idToken: {
              idToken: 'deadbeef',
              type: 'ISO14443',
            },
          },
          OCPPVersion.OCPP2_0_1,
        );

        expect(result.isValid).toBe(true);
      });
    });

    it('should return invalid for unknown protocol version', () => {
      const result = validator.validateOCPPRequest(
        OCPP2_0_1_CallAction.Heartbeat,
        {},
        'ocpp1.1' as OCPPVersion,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeUndefined();
    });

    it('should return invalid when no schema is found for the action', () => {
      const result = validator.validateOCPPRequest(
        'UnknownAction' as OCPP2_0_1_CallAction,
        {},
        OCPPVersion.OCPP2_0_1,
      );

      expect(result.isValid).toBe(false);
    });

    describe('DataTransfer request validation', () => {
      it('should validate a valid DataTransfer request for OCPP 2.0.1', () => {
        const payload = {
          vendorId: 'TestVendor',
        };

        const result = validator.validateOCPPRequest(
          OCPP2_0_1_CallAction.DataTransfer,
          payload,
          OCPPVersion.OCPP2_0_1,
        );

        expect(result.isValid).toBe(true);
      });

      it('should validate a valid DataTransfer request for OCPP 1.6', () => {
        const payload = {
          vendorId: 'TestVendor',
        };

        const result = validator.validateOCPPRequest(
          OCPP1_6_CallAction.DataTransfer,
          payload,
          OCPPVersion.OCPP1_6,
        );

        expect(result.isValid).toBe(true);
      });

      it('should validate DataTransfer payload when a custom schema is registered', () => {
        const customSchema = {
          $id: `${OCPPVersion.OCPP2_0_1}-CustomVendor`,
          type: 'object',
          properties: {
            key: { type: 'string' },
          },
          required: ['key'],
        };
        validator['_ajv'].addSchema(customSchema);

        const payload = {
          vendorId: 'CustomVendor',
          data: JSON.stringify({ key: 'value' }),
        };

        const result = validator.validateOCPPRequest(
          OCPP2_0_1_CallAction.DataTransfer,
          payload,
          OCPPVersion.OCPP2_0_1,
        );

        expect(result.isValid).toBe(true);
      });

      it('should return invalid when DataTransfer custom payload fails validation', () => {
        const customSchema = {
          $id: `${OCPPVersion.OCPP2_0_1}-FailVendor`,
          type: 'object',
          properties: {
            key: { type: 'string' },
          },
          required: ['key'],
        };
        validator['_ajv'].addSchema(customSchema);

        const payload = {
          vendorId: 'FailVendor',
          data: JSON.stringify({ wrong: 123 }),
        };

        const result = validator.validateOCPPRequest(
          OCPP2_0_1_CallAction.DataTransfer,
          payload,
          OCPPVersion.OCPP2_0_1,
        );

        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
      });

      it('should include messageId in DataTransfer schema lookup when present', () => {
        const customSchema = {
          $id: `${OCPPVersion.OCPP2_0_1}-MsgVendor-CustomMsg`,
          type: 'object',
          properties: {
            value: { type: 'number' },
          },
          required: ['value'],
        };
        validator['_ajv'].addSchema(customSchema);

        const payload = {
          vendorId: 'MsgVendor',
          messageId: 'CustomMsg',
          data: JSON.stringify({ value: 42 }),
        };

        const result = validator.validateOCPPRequest(
          OCPP2_0_1_CallAction.DataTransfer,
          payload,
          OCPPVersion.OCPP2_0_1,
        );

        expect(result.isValid).toBe(true);
      });

      it('should skip DataTransfer payload validation when no custom schema is registered', () => {
        const payload = {
          vendorId: 'UnregisteredVendor',
          data: JSON.stringify({ anything: 'goes' }),
        };

        const result = validator.validateOCPPRequest(
          OCPP2_0_1_CallAction.DataTransfer,
          payload,
          OCPPVersion.OCPP2_0_1,
        );

        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateOCPPResponse', () => {
    describe('OCPP 1.6', () => {
      it('should validate a valid BootNotification response', () => {
        const payload = {
          currentTime: '2024-01-01T00:00:00Z',
          interval: 300,
          status: 'Accepted',
        };

        const result = validator.validateOCPPResponse(
          OCPP1_6_CallAction.BootNotification,
          payload,
          OCPPVersion.OCPP1_6,
        );

        expect(result.isValid).toBe(true);
        expect(result.errors).toBeUndefined();
      });

      it('should return invalid for a malformed response', () => {
        const payload = {
          // missing required fields
        };

        const result = validator.validateOCPPResponse(
          OCPP1_6_CallAction.BootNotification,
          payload,
          OCPPVersion.OCPP1_6,
        );

        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.length).toBeGreaterThan(0);
      });

      it('should validate a valid Heartbeat response', () => {
        const payload = {
          currentTime: '2024-01-01T00:00:00Z',
        };

        const result = validator.validateOCPPResponse(
          OCPP1_6_CallAction.Heartbeat,
          payload,
          OCPPVersion.OCPP1_6,
        );

        expect(result.isValid).toBe(true);
      });

      it('should return invalid for Heartbeat response missing currentTime', () => {
        const result = validator.validateOCPPResponse(
          OCPP1_6_CallAction.Heartbeat,
          {},
          OCPPVersion.OCPP1_6,
        );

        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });

    describe('OCPP 2.0.1', () => {
      it('should validate a valid Heartbeat response', () => {
        const payload = {
          currentTime: '2024-01-01T00:00:00Z',
        };

        const result = validator.validateOCPPResponse(
          OCPP2_0_1_CallAction.Heartbeat,
          payload,
          OCPPVersion.OCPP2_0_1,
        );

        expect(result.isValid).toBe(true);
      });

      it('should return invalid for a malformed Heartbeat response', () => {
        const result = validator.validateOCPPResponse(
          OCPP2_0_1_CallAction.Heartbeat,
          {},
          OCPPVersion.OCPP2_0_1,
        );

        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
      });
    });

    it('should return invalid for unknown protocol version', () => {
      const result = validator.validateOCPPResponse(
        OCPP2_0_1_CallAction.Heartbeat,
        { currentTime: '2024-01-01T00:00:00Z' },
        'ocpp1.1' as OCPPVersion,
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeUndefined();
    });

    it('should return invalid when no schema is found for the action', () => {
      const result = validator.validateOCPPResponse(
        'UnknownAction' as OCPP2_0_1_CallAction,
        {},
        OCPPVersion.OCPP2_0_1,
      );

      expect(result.isValid).toBe(false);
    });
  });

  describe('sanitizeOCPPPayload', () => {
    it('should replace null values with undefined in a flat object', () => {
      const payload = {
        id: 'test',
        value: null,
        status: 'Accepted',
      };

      const result = validator.sanitizeOCPPPayload(payload as any);

      expect(result.id).toBe('test');
      expect(result.status).toBe('Accepted');
      expect(result.value).toBeUndefined();
    });

    it('should replace null values with undefined in nested objects', () => {
      const payload = {
        outer: {
          inner: null,
          kept: 'yes',
        },
        top: 'level',
      };

      const result = validator.sanitizeOCPPPayload(payload as any);

      expect(result.outer.kept).toBe('yes');
      expect(result.outer.inner).toBeUndefined();
      expect(result.top).toBe('level');
    });

    it('should filter null values from arrays', () => {
      const payload = {
        items: [1, null, 3, null, 5],
      };

      const result = validator.sanitizeOCPPPayload(payload as any);

      expect(result.items).toEqual([1, 3, 5]);
    });

    it('should handle deeply nested nulls', () => {
      const payload = {
        a: {
          b: {
            c: null,
            d: 'keep',
          },
          e: null,
        },
      };

      const result = validator.sanitizeOCPPPayload(payload as any);

      expect(result.a.b.d).toBe('keep');
      expect(result.a.b.c).toBeUndefined();
      expect(result.a.e).toBeUndefined();
    });

    it('should preserve non-null values unchanged', () => {
      const payload = {
        str: 'hello',
        num: 42,
        bool: true,
        arr: [1, 2, 3],
        obj: { nested: 'value' },
      };

      const result = validator.sanitizeOCPPPayload(payload as any);

      expect(result.str).toBe('hello');
      expect(result.num).toBe(42);
      expect(result.bool).toBe(true);
      expect(result.arr).toEqual([1, 2, 3]);
      expect(result.obj).toEqual({ nested: 'value' });
    });

    it('should handle empty objects', () => {
      const result = validator.sanitizeOCPPPayload({} as any);
      expect(result).toEqual({});
    });

    it('should handle arrays with nested objects containing nulls', () => {
      const payload = {
        items: [
          { id: 1, value: null },
          { id: 2, value: 'keep' },
        ],
      };

      const result = validator.sanitizeOCPPPayload(payload as any);

      expect(result.items[0].id).toBe(1);
      expect(result.items[0].value).toBeUndefined();
      expect(result.items[1].id).toBe(2);
      expect(result.items[1].value).toBe('keep');
    });

    it('should remove null entries from arrays entirely', () => {
      const payload = {
        items: ['a', null, 'b'],
      };

      const result = validator.sanitizeOCPPPayload(payload as any);

      expect(result.items).toHaveLength(2);
      expect(result.items).toEqual(['a', 'b']);
    });
  });

  describe('schema caching', () => {
    it('should reuse cached schema on subsequent validations', () => {
      const payload = {
        chargePointModel: 'TestModel',
        chargePointVendor: 'TestVendor',
      };

      // First call compiles the schema
      const result1 = validator.validateOCPPRequest(
        OCPP1_6_CallAction.BootNotification,
        payload,
        OCPPVersion.OCPP1_6,
      );

      // Second call should reuse cached schema
      const result2 = validator.validateOCPPRequest(
        OCPP1_6_CallAction.BootNotification,
        { ...payload },
        OCPPVersion.OCPP1_6,
      );

      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
    });

    it('should return errors as a deep copy that do not affect the cached validator', () => {
      // First call - get validation errors
      const result1 = validator.validateOCPPRequest(
        OCPP1_6_CallAction.BootNotification,
        {},
        OCPPVersion.OCPP1_6,
      );

      // Mutate the returned errors
      if (result1.errors && result1.errors.length > 0) {
        result1.errors[0].message = 'MUTATED';
      }

      // Second call - errors should not be affected by the mutation
      const result2 = validator.validateOCPPRequest(
        OCPP1_6_CallAction.BootNotification,
        {},
        OCPPVersion.OCPP1_6,
      );

      expect(result2.isValid).toBe(false);
      expect(result2.errors).toBeDefined();
      expect(result2.errors![0].message).not.toBe('MUTATED');
    });
  });

  describe('cross-version validation', () => {
    it.each([
      [OCPP2_0_1_CallAction.BootNotification, OCPPVersion.OCPP2_0_1, 'OCPP 2.0.1'],
      [OCPP1_6_CallAction.BootNotification, OCPPVersion.OCPP1_6, 'OCPP 1.6'],
    ])('should have request schemas for %s in %s', (action, version) => {
      const schemaMap =
        version === OCPPVersion.OCPP2_0_1 ? OCPP2_0_1_CALL_SCHEMA_MAP : OCPP1_6_CALL_SCHEMA_MAP;
      expect(schemaMap.get(action)).toBeDefined();
    });

    it.each([
      [OCPP2_0_1_CallAction.BootNotification, OCPPVersion.OCPP2_0_1, 'OCPP 2.0.1'],
      [OCPP1_6_CallAction.BootNotification, OCPPVersion.OCPP1_6, 'OCPP 1.6'],
    ])('should have response schemas for %s in %s', (action, version) => {
      const schemaMap =
        version === OCPPVersion.OCPP2_0_1
          ? OCPP2_0_1_CALL_RESULT_SCHEMA_MAP
          : OCPP1_6_CALL_RESULT_SCHEMA_MAP;
      expect(schemaMap.get(action)).toBeDefined();
    });
  });
});
