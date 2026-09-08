// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { KoaMiddlewareInterface } from 'routing-controllers';
import { NotFoundError, UnauthorizedError } from 'routing-controllers';
import type { Context } from 'vm';
import { HttpStatus, UnauthorizedException } from '@citrineos/base';
import { buildOcpiErrorResponse } from '../../model/ocpi-error-response.js';
import { UnknownTokenException } from '../../exception/unknown-token-exception.js';
import { OcpiResponseStatusCode } from '../../model/ocpi-response.js';
import { WrongClientAccessException } from '../../exception/wrong-client-access-exception.js';
import { InvalidParamException } from '../../exception/invalid-param-exception.js';
import { MissingParamException } from '../../exception/missing-param-exception.js';
import { AlreadyRegisteredException } from '../../exception/already-registered-exception.js';
import { NotRegisteredException } from '../../exception/not-registered-exception.js';
import { UnsuccessfulRequestException } from '../../exception/unsuccessful-request-exception.js';
import { ContentType } from '../content-type.js';

/**
 * GlobalExceptionHandler handles all exceptions
 */
export class OcpiExceptionHandler implements KoaMiddlewareInterface {
  public async use(context: Context, next: (err?: any) => Promise<any>): Promise<any> {
    try {
      await next();
    } catch (err) {
      console.error('OcpiExceptionHandler error', err);
      context.type = ContentType.JSON;
      if (err?.constructor?.name) {
        switch (err.constructor.name) {
          case UnauthorizedException.name:
          case UnauthorizedError.name:
            context.status = HttpStatus.UNAUTHORIZED;
            context.body = JSON.stringify(
              buildOcpiErrorResponse(
                OcpiResponseStatusCode.ClientNotEnoughInformation,
                'Not Authorized',
              ),
            );
            break;
          case NotFoundError.name:
            context.status = HttpStatus.NOT_FOUND;
            context.body = JSON.stringify(
              buildOcpiErrorResponse(
                OcpiResponseStatusCode.ClientInvalidOrMissingParameters,
                'Credentials not found',
              ),
            );
            break;
          case MissingParamException.name:
            context.status = HttpStatus.BAD_REQUEST;
            context.body = JSON.stringify(
              buildOcpiErrorResponse(
                OcpiResponseStatusCode.ClientInvalidOrMissingParameters,
                (err as any).message,
              ),
            );
            break;
          case AlreadyRegisteredException.name:
            context.status = HttpStatus.METHOD_NOT_ALLOWED;
            context.body = JSON.stringify(
              buildOcpiErrorResponse(
                OcpiResponseStatusCode.ClientNotEnoughInformation,
                'Client already registered',
              ),
            );
            break;
          case NotRegisteredException.name:
            context.status = HttpStatus.METHOD_NOT_ALLOWED;
            context.body = JSON.stringify(
              buildOcpiErrorResponse(
                OcpiResponseStatusCode.ClientNotEnoughInformation,
                'Client not registered',
              ),
            );
            break;
          case UnknownTokenException.name:
            context.status = HttpStatus.NOT_FOUND;
            context.body = JSON.stringify(
              buildOcpiErrorResponse(
                OcpiResponseStatusCode.ClientUnknownToken,
                (err as any).message,
              ),
            );
            break;
          case WrongClientAccessException.name:
            context.status = HttpStatus.NOT_FOUND;
            break;
          case InvalidParamException.name:
            context.status = HttpStatus.BAD_REQUEST;
            context.body = JSON.stringify(
              buildOcpiErrorResponse(
                OcpiResponseStatusCode.ClientInvalidOrMissingParameters,
                (err as any).message,
              ),
            );
            break;
          case UnsuccessfulRequestException.name:
            context.status = HttpStatus.BAD_REQUEST;
            context.body = JSON.stringify(
              buildOcpiErrorResponse(
                OcpiResponseStatusCode.ServerGenericError,
                (err as any).message,
              ),
            );
            break;
          default: {
            const httpCode = (err as any)?.httpCode;
            if (typeof httpCode === 'number' && httpCode >= 400 && httpCode < 500) {
              context.status = httpCode;
              context.body = JSON.stringify(
                buildOcpiErrorResponse(
                  OcpiResponseStatusCode.ClientInvalidOrMissingParameters,
                  `${(err as Error).message}${(err as any).errors ? ': ' + JSON.stringify((err as any).errors) : ''}`,
                ),
              );
              break;
            }
            context.status = HttpStatus.INTERNAL_SERVER_ERROR;
            context.body = JSON.stringify(
              buildOcpiErrorResponse(
                OcpiResponseStatusCode.ClientGenericError,
                `Internal Server Error, ${(err as Error).message}: ${JSON.stringify((err as any).errors)}`,
              ),
            );
          }
        }
      }
    }
  }
}
