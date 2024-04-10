// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { HttpMethod, IDataEndpointDefinition, METADATA_DATA_ENDPOINTS } from '.';
import { Namespace } from '../../ocpp/persistence';

/**
 * Decorator for use in module API class to expose methods as REST data endpoints.
 *
 * @param {Namespace} namespace - The namespace value.
 * @param {HttpMethod} method - The HTTP method value.
 * @param {object} querySchema - The query schema value (optional).
 * @param {object} bodySchema - The body schema value (optional).
 * @return {void} - No return value.
 */
export const AsDataEndpoint = function (namespace: Namespace, method: HttpMethod, querySchema?: object, bodySchema?: object) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor): void => {
        if (!Reflect.hasMetadata(METADATA_DATA_ENDPOINTS, target.constructor)) {
            Reflect.defineMetadata(METADATA_DATA_ENDPOINTS, [], target.constructor);
        }
        const dataEndpoints = Reflect.getMetadata(METADATA_DATA_ENDPOINTS, target.constructor) as Array<IDataEndpointDefinition>;
        dataEndpoints.push({
            method: descriptor.value,
            methodName: propertyKey,
            namespace: namespace,
            httpMethod: method,
            querySchema: querySchema,
            bodySchema: bodySchema
        });
        Reflect.defineMetadata(METADATA_DATA_ENDPOINTS, dataEndpoints, target.constructor);
    };
};
