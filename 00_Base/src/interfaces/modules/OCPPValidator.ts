// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { Ajv, type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import {
  OCPP1_6_CALL_RESULT_SCHEMA_MAP,
  OCPP1_6_CALL_SCHEMA_MAP,
  OCPP2_0_1_CALL_RESULT_SCHEMA_MAP,
  OCPP2_0_1_CALL_SCHEMA_MAP,
  type OcppRequest,
  type OcppResponse,
} from '../../index.js';
import {
  type CallAction,
  OCPP1_6_CallAction,
  OCPP2_0_1_CallAction,
  OCPPVersion,
} from '../../ocpp/rpc/message.js';

export class OCPPValidator {
  protected _ajv: Ajv;
  protected readonly _logger: Logger<ILogObj>;

  constructor(logger?: Logger<ILogObj>, ajv?: Ajv) {
    this._ajv = ajv || OCPPValidator.createServerAjvInstance();
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Creates an Ajv instance configured for server use with OCPP schema validation.
   * This includes custom keywords and format validation suitable for the CitrineOS server.
   *
   * @param ajv - Optional existing Ajv instance to use instead of creating a new one
   * @returns Configured Ajv instance for server use
   */
  static createServerAjvInstance(ajv?: Ajv): Ajv {
    const ajvInstance =
      ajv ||
      new Ajv({
        removeAdditional: 'failing', // Remove invalid additional properties but keep valid ones
        useDefaults: true,
        strict: false,
        strictNumbers: true,
        strictRequired: true,
        validateFormats: true,
        allErrors: true, // Report all validation errors
      });

    OCPPValidator.addOcppKeywords(ajvInstance);
    OCPPValidator.addFormats(ajvInstance);

    return ajvInstance;
  }

  /**
   * Creates an Ajv instance configured for validator use with OCPP message validation.
   * This configuration is optimized for validating OCPP messages with coercion and removal of additional properties.
   *
   * @param ajv - Optional existing Ajv instance to use instead of creating a new one
   * @returns Configured Ajv instance for validator use
   */
  static createValidatorAjvInstance(ajv?: Ajv): Ajv {
    const ajvInstance =
      ajv ||
      new Ajv({
        removeAdditional: 'failing', // Remove invalid additional properties but keep valid ones
        useDefaults: true,
        strict: false,
        strictNumbers: true,
        strictRequired: true,
        validateFormats: true,
        allErrors: true, // Report all validation errors
      });

    OCPPValidator.addOcppKeywords(ajvInstance);
    OCPPValidator.addFormats(ajvInstance);

    return ajvInstance;
  }

  /**
   * Adds custom keywords for OCPP schema metadata to an Ajv instance.
   * These keywords are used in OCPP JSON schemas but don't affect validation.
   *
   * @param ajv - The Ajv instance to add keywords to
   */
  static addOcppKeywords(ajv: Ajv): void {
    // Add custom keywords for OCPP schema metadata
    ajv.addKeyword({
      keyword: 'comment',
      compile: () => () => true,
    });

    ajv.addKeyword({
      keyword: 'javaType',
      compile: () => () => true,
    });

    ajv.addKeyword({
      keyword: 'tsEnumNames',
      compile: () => () => true,
    });
  }

  /**
   * Adds format validation for date-time and URI formats to an Ajv instance.
   *
   * @param ajv - The Ajv instance to add formats to
   */
  static addFormats(ajv: Ajv): void {
    addFormats.default(ajv, {
      mode: 'fast',
      formats: ['date-time', 'uri'],
    });
  }

  /**
   * Validates an OCPP Request object against its schema.
   *
   * @param {CallAction} action - The original CallAction.
   * @param {OcppRequest} payload - The OCPP Request object to validate.
   * @param {OCPPVersion} protocol - The OCPP protocol version.
   * @return {boolean} - Returns true if the OCPP Request object is valid, false otherwise.
   */
  public validateOCPPRequest(
    action: CallAction,
    payload: OcppRequest,
    protocol: OCPPVersion,
  ): { isValid: boolean; errors?: ErrorObject[] | null } {
    let schema: any;
    switch (protocol) {
      case OCPPVersion.OCPP1_6:
        schema = OCPP1_6_CALL_SCHEMA_MAP.get(action);
        break;
      case OCPPVersion.OCPP2_0_1:
        schema = OCPP2_0_1_CALL_SCHEMA_MAP.get(action);
        break;
      default:
        this._logger.error('Unknown subprotocol', protocol);
        return { isValid: false };
    }

    if (schema) {
      let validate = this._ajv.getSchema(schema['$id']);
      if (!validate) {
        schema['$id'] = `${protocol}-${schema['$id']}`;
        this._logger.debug(`Updated call result schema id: ${schema['$id']}`);

        this.fixRefs(schema);

        validate = this._ajv.compile(schema);
      }
      const result = validate(payload);
      if (!result) {
        const validationErrorsDeepCopy = JSON.parse(JSON.stringify(validate.errors));
        this._logger.debug('Validate Call failed', validationErrorsDeepCopy);
        return { isValid: false, errors: validationErrorsDeepCopy };
      } else {
        if (
          action === OCPP1_6_CallAction.DataTransfer ||
          action === OCPP2_0_1_CallAction.DataTransfer
        ) {
          const dataTransferRequest: { vendorId: string; messageId?: string; data: string } =
            payload as any;
          const dataTransferPayloadValidate = this._ajv.getSchema(
            `${protocol}-${dataTransferRequest.vendorId}${dataTransferRequest.messageId ? `-${dataTransferRequest.messageId}` : ''}`,
          );
          if (dataTransferPayloadValidate) {
            const dataTransferPayloadResult = dataTransferPayloadValidate(
              JSON.parse(dataTransferRequest.data),
            );
            if (!dataTransferPayloadResult) {
              const validationErrorsDeepCopy = JSON.parse(
                JSON.stringify(dataTransferPayloadValidate.errors),
              );
              this._logger.debug('Validate DataTransfer payload failed', validationErrorsDeepCopy);
              return { isValid: false, errors: validationErrorsDeepCopy };
            }
          }
        }
        return { isValid: true };
      }
    } else {
      this._logger.error('No schema found for action', action, payload);
      return { isValid: false };
    }
  }

  /**
   * Validates an OCPP Response against its schema.
   *
   * @param {CallAction} action - The original CallAction.
   * @param {OcppResponse} payload - The OCPPResponse object to validate.
   * @param {OCPPVersion} protocol - The OCPP protocol version.
   * @return {boolean} - Returns true if the OCPPResponse object is valid, false otherwise.
   */
  public validateOCPPResponse(
    action: CallAction,
    payload: OcppResponse,
    protocol: OCPPVersion,
  ): { isValid: boolean; errors?: ErrorObject[] | null } {
    let schema: any;
    switch (protocol) {
      case OCPPVersion.OCPP1_6:
        schema = OCPP1_6_CALL_RESULT_SCHEMA_MAP.get(action);
        break;
      case OCPPVersion.OCPP2_0_1:
        schema = OCPP2_0_1_CALL_RESULT_SCHEMA_MAP.get(action);
        break;
      default:
        this._logger.error('Unknown subprotocol', protocol);
        return { isValid: false };
    }
    if (schema) {
      let validate = this._ajv.getSchema(schema['$id']);
      if (!validate) {
        schema['$id'] = `${protocol}-${schema['$id']}`;
        this._logger.debug(`Updated call result schema id: ${schema['$id']}`);
        // this.addSchemaDefinitionsRecursively(schema);
        validate = this._ajv.compile(schema);
      }
      const result = validate(payload);
      if (!result) {
        const validationErrorsDeepCopy = JSON.parse(JSON.stringify(validate.errors));
        this._logger.debug('Validate CallResult failed', validationErrorsDeepCopy);
        return { isValid: false, errors: validationErrorsDeepCopy };
      } else {
        return { isValid: true };
      }
    } else {
      this._logger.error('No schema found for call result with action', action, payload);
      return { isValid: false };
    }
  }

  /**
   * Prepares an OCPP Payload for sending by removing any null values, as OCPP does not allow null values in its messages.
   *
   * @param message OCPP Payload, as an object
   * @returns The sanitized OCPP Payload, with null values removed
   */
  public sanitizeOCPPPayload<T extends OcppRequest | OcppResponse>(message: T): T {
    this._logger.debug('Sanitizing OCPP message: ', message);
    const sanitizedMessage = this.removeNulls(message);
    this._logger.debug('Sanitized OCPP message: ', sanitizedMessage);
    return sanitizedMessage;
  }

  // Intentionally removing NULL values from object for OCPP conformity
  private removeNulls<T>(obj: T): T {
    if (obj === null) return undefined as T;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.filter((item) => item !== null).map((item) => this.removeNulls(item)) as T;
    }

    const result = {} as T;
    for (const [key, value] of Object.entries(obj as object)) {
      result[key as keyof T] = this.removeNulls(value);
    }
    return result;
  }

  // Recursively fix $ref in schema to ensure they are compatible with Ajv when compiling
  private fixRefs(schema: any) {
    if (!schema.properties) return;
    Object.keys(schema.properties).forEach((key) => {
      const property = schema.properties[key];
      if (property.$ref) {
        property.$ref = property.$ref.replace('#/definitions/', '');
      }
      if (property.items && property.items.$ref) {
        property.items.$ref = property.items.$ref.replace('#/definitions/', '');
      }
    });
    if (schema.definitions) {
      Object.keys(schema.definitions).forEach((key) => {
        const definition = schema.definitions[key];
        if (!definition['$id']) {
          definition['$id'] = key;
        }
        this.fixRefs(definition);
      });
    }
  }
}
