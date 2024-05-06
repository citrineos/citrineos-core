// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AsDataEndpoint, HttpMethod, OcpiTag } from '@citrineos/base';
import { targetConstructorToSchema } from 'class-validator-jsonschema';

/**
 * Decorator for use in module API class to expose methods as REST data endpoints.
 *
 * @param {Url} url - The url value.
 * @param {HttpMethod} method - The HTTP method value.
 * @param {object} querySchema - The query schema value (optional).
 * @param {object} bodySchema - The body schema value (optional).
 * @param {object} paramSchema - The param schema value (optional).
 * @param {object} headerSchema - The param schema value (optional).
 * @param {object} responseSchema - The responses (optional).
 * @return {void} - No return value.
 */
export const AsOcpiEndpoint = function (
  url: string,
  method: HttpMethod,
  querySchema?: object,
  bodySchema?: object,
  paramSchema?: object,
  headerSchema?: object,
  responseSchema?: object,
  tags?: OcpiTag | OcpiTag[],
  security?: object[],
  description?: string,
) {
  if (headerSchema === null || headerSchema === undefined) {
    headerSchema = {};
  }
  // @ts-expect-error setting header
  headerSchema['authorization'] = { type: 'string', required: true }; // String authorization,
  // @ts-expect-error setting header
  headerSchema['X-Request-ID'] = { type: 'string', required: true }; // String xRequestID,
  // @ts-expect-error setting header
  headerSchema['X-Correlation-ID'] = { type: 'string', required: true }; // String xCorrelationID,
  // @ts-expect-error setting header
  headerSchema['OCPI-from-country-code'] = { type: 'string', required: true }; // String ocPIFromCountryCode,
  // @ts-expect-error setting header
  headerSchema['OCPI-from-party-id'] = { type: 'string', required: true }; // String ocPIFromPartyId,
  // @ts-expect-error setting header
  headerSchema['OCPI-to-country-code'] = { type: 'string', required: true }; // String ocPIToCountryCode,
  // @ts-expect-error setting header
  headerSchema['OCPI-to-party-id'] = { type: 'string', required: true }; // String ocPIToPartyId,
  return AsDataEndpoint(
    url,
    method,
    querySchema ? targetConstructorToSchema(querySchema as any) : undefined,
    bodySchema ? targetConstructorToSchema(bodySchema as any) : undefined,
    paramSchema ? targetConstructorToSchema(paramSchema as any) : undefined,
    headerSchema ? targetConstructorToSchema(headerSchema as any) : undefined,
    responseSchema
      ? targetConstructorToSchema(responseSchema as any)
      : undefined,
    Array.isArray(tags) ? tags.map((tag) => `ocpi-${tag}`) : [`ocpi-${tags}`],
    security,
    description,
  );
};
