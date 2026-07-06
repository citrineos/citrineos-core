// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { KoaMiddlewareInterface } from 'routing-controllers';
import { NotFoundError, UnauthorizedError } from 'routing-controllers';
import type { Context } from 'vm';
import { HttpStatus, UnauthorizedException } from '@citrineos/base';
import { buildOcpiErrorResponse } from '../../model/OcpiErrorResponse.js';
import { Service } from 'typedi';
import { UnknownTokenException } from '../../exception/UnknownTokenException.js';
import { OcpiResponseStatusCode } from '../../model/OcpiResponse.js';
import { WrongClientAccessException } from '../../exception/WrongClientAccessException.js';
import { InvalidParamException } from '../../exception/InvalidParamException.js';
import { MissingParamException } from '../../exception/MissingParamException.js';
import { AlreadyRegisteredException } from '../../exception/AlreadyRegisteredException.js';
import { NotRegisteredException } from '../../exception/NotRegisteredException.js';
import { UnsuccessfulRequestException } from '../../exception/UnsuccessfulRequestException.js';
import { ContentType } from '../ContentType.js';

/**
 * GlobalExceptionHandler handles all exceptions
 */
@Service()
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
          default:
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
