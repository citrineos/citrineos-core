// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { HttpMethod, IDataEndpointDefinition, METADATA_DATA_ENDPOINTS } from '.';
import { Namespace, OCPP1_6_Namespace, OCPP2_0_1_Namespace } from '../../ocpp/persistence';

/**
 * Decorator for use in module API class to expose methods as REST data endpoints.
 *
 * @param {OCPP2_0_1_Namespace} namespace - The namespace value.
 * @param {HttpMethod} method - The HTTP method value.
 * @param {object} querySchema - The query schema value (optional).
 * @param {object} bodySchema - The body schema value (optional).
 * @param {object} paramSchema - The param schema value (optional).
 * @param {object} headerSchema - The header schema value (optional).
 * @param {object} responseSchema - The response schema value (optional).
 * @param {object} tags - The tags value (optional).
 * @param {object} security - The security value (optional).
 * @param {string} description - The description (optional).
 * @return {void} - No return value.
 */
export const AsDataEndpoint = function (
  namespace: OCPP2_0_1_Namespace | OCPP1_6_Namespace | Namespace,
  method: HttpMethod,
  querySchema?: object,
  bodySchema?: object,
  paramSchema?: object,
  headerSchema?: object,
  responseSchema?: object,
  tags?: string | string[],
  security?: object[],
  description?: string,
) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor): void => {
    if (!Reflect.hasMetadata(METADATA_DATA_ENDPOINTS, target.constructor)) {
      Reflect.defineMetadata(METADATA_DATA_ENDPOINTS, [], target.constructor);
    }
    const dataEndpoints = Reflect.getMetadata(
      METADATA_DATA_ENDPOINTS,
      target.constructor,
    ) as Array<IDataEndpointDefinition>;
    let tagList: string[] | undefined = undefined;
    if (tags) {
      tagList = Array.isArray(tags) ? tags : [tags];
    }
    dataEndpoints.push({
      method: descriptor.value,
      methodName: propertyKey,
      namespace: namespace,
      httpMethod: method,
      querySchema: querySchema,
      bodySchema: bodySchema,
      paramSchema: paramSchema,
      headerSchema: headerSchema,
      responseSchema: responseSchema,
      tags: tagList,
      description: description,
      security: security,
    });
    Reflect.defineMetadata(METADATA_DATA_ENDPOINTS, dataEndpoints, target.constructor);
  };
};
