// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {AsDataEndpoint, HttpMethod, Namespace} from '@citrineos/base';

/**
 * Decorator for use in module API class to expose methods as REST data endpoints.
 *
 * @param {Namespace} namespace - The namespace value.
 * @param {HttpMethod} method - The HTTP method value.
 * @param {object} querySchema - The query schema value (optional).
 * @param {object} bodySchema - The body schema value (optional).
 * @param {object} paramSchema - The param schema value (optional).
 * @param {object} headerSchema - The param schema value (optional).
 * @param {object} responseSchema - The responses (optional).
 * @return {void} - No return value.
 */
export const AsOcpiEndpoint = function (
  namespace: string,
  method: HttpMethod,
  querySchema?: object,
  bodySchema?: object,
  paramSchema?: object,
  headerSchema?: object,
  responseSchema?: object,
) {
  headerSchema['authorization'] = { type: 'string', required: true }; // String authorization,
  headerSchema['X-Request-ID'] = { type: 'string', required: true }; // String xRequestID,
  headerSchema['X-Correlation-ID'] = { type: 'string', required: true }; // String xCorrelationID,
  headerSchema['OCPI-from-country-code'] = { type: 'string', required: true }; // String ocPIFromCountryCode,
  headerSchema['OCPI-from-party-id'] = { type: 'string', required: true }; // String ocPIFromPartyId,
  headerSchema['OCPI-to-country-code'] = { type: 'string', required: true }; // String ocPIToCountryCode,
  headerSchema['OCPI-to-party-id'] = { type: 'string', required: true }; // String ocPIToPartyId,
  return AsDataEndpoint(
    namespace,
    method,
    querySchema,
    bodySchema,
    paramSchema,
    headerSchema,
    responseSchema,
  );
};
