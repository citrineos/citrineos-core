// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { NotFoundException } from '../exception/NotFoundException.js';
import { buildOcpiResponse, OcpiResponseStatusCode } from '../model/OcpiResponse.js';

export class ResponseGenerator {
  static buildGenericSuccessResponse<T>(data?: T, message?: string) {
    return buildOcpiResponse(OcpiResponseStatusCode.GenericSuccessCode, data, message ?? 'Success');
  }

  static buildGenericServerErrorResponse<T>(data?: T, message?: string, error?: Error) {
    return buildOcpiResponse(
      OcpiResponseStatusCode.ServerGenericError,
      data,
      message ?? error?.message,
    );
  }

  static buildGenericClientErrorResponse<T>(data?: T, message?: string, error?: Error) {
    return buildOcpiResponse(
      OcpiResponseStatusCode.ClientGenericError,
      data,
      message ?? error?.message,
    );
  }

  static buildUnknownLocationResponse<T>(data?: T, message?: string, error?: Error) {
    return buildOcpiResponse(
      OcpiResponseStatusCode.ClientUnknownLocation,
      data,
      message ?? error?.message,
    );
  }

  static buildInvalidOrMissingParametersResponse<T>(data?: T, message?: string, error?: Error) {
    return buildOcpiResponse(
      OcpiResponseStatusCode.ClientInvalidOrMissingParameters,
      data,
      message ?? error?.message,
    );
  }

  static buildUnknownSessionResponse<T>(data: T, error: NotFoundException) {
    return this.buildGenericClientErrorResponse(data, error.message, error);
  }
}
