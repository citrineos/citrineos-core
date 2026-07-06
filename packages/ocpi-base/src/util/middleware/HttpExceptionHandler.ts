// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { KoaMiddlewareInterface } from 'routing-controllers';
import { NotFoundError, UnauthorizedError } from 'routing-controllers';
import type { Context } from 'vm';
import { Service } from 'typedi';
import { HttpStatus, UnauthorizedException } from '@citrineos/base';
import { MissingParamException } from '../../exception/MissingParamException.js';
import { AlreadyRegisteredException } from '../../exception/AlreadyRegisteredException.js';
import { NotRegisteredException } from '../../exception/NotRegisteredException.js';
import { UnknownTokenException } from '../../exception/UnknownTokenException.js';
import { WrongClientAccessException } from '../../exception/WrongClientAccessException.js';
import { InvalidParamException } from '../../exception/InvalidParamException.js';
import { UnsuccessfulRequestException } from '../../exception/UnsuccessfulRequestException.js';
import { NotFoundException } from '../../exception/NotFoundException.js';
import { ContentType } from '../ContentType.js';

class HttpExceptionBody {
  message?: string;

  constructor(message?: string) {
    this.message = message;
  }
}

@Service()
export class HttpExceptionHandler implements KoaMiddlewareInterface {
  public async use(context: Context, next: (err?: any) => Promise<any>): Promise<any> {
    try {
      await next();
    } catch (err) {
      console.error('HttpExceptionHandler error', err);
      context.type = ContentType.JSON;
      if (err?.constructor?.name) {
        switch (err.constructor.name) {
          case UnauthorizedError.name:
          case UnauthorizedException.name:
            context.status = HttpStatus.UNAUTHORIZED;
            context.body = JSON.stringify(new HttpExceptionBody('Not Authorized'));
            break;
          case NotFoundError.name:
          case NotFoundException.name:
            context.status = HttpStatus.NOT_FOUND;
            context.body = JSON.stringify(new HttpExceptionBody((err as any).message));
            break;
          case MissingParamException.name:
            context.status = HttpStatus.BAD_REQUEST;
            context.body = JSON.stringify(new HttpExceptionBody((err as any).message));
            break;
          case AlreadyRegisteredException.name:
            context.status = HttpStatus.METHOD_NOT_ALLOWED;
            context.body = JSON.stringify(new HttpExceptionBody('Client already registered'));
            break;
          case NotRegisteredException.name:
            context.status = HttpStatus.METHOD_NOT_ALLOWED;
            context.body = JSON.stringify(new HttpExceptionBody('Client not registered'));
            break;
          case UnknownTokenException.name:
            context.status = HttpStatus.NOT_FOUND;
            context.body = JSON.stringify(new HttpExceptionBody((err as any).message));
            break;
          case WrongClientAccessException.name:
            context.status = HttpStatus.NOT_FOUND;
            break;
          case InvalidParamException.name:
            context.status = HttpStatus.BAD_REQUEST;
            context.body = JSON.stringify(new HttpExceptionBody((err as any).message));
            break;
          case UnsuccessfulRequestException.name:
            context.status = HttpStatus.BAD_REQUEST;
            context.body = JSON.stringify(new HttpExceptionBody((err as any).message));
            break;
          case 'SequelizeUniqueConstraintError':
            context.status = HttpStatus.BAD_REQUEST;
            context.body = JSON.stringify(new HttpExceptionBody((err as any).message));
            break;
          default:
            context.status = HttpStatus.INTERNAL_SERVER_ERROR;
            context.body = JSON.stringify(
              new HttpExceptionBody(
                `Internal Server Error, ${(err as Error).message}${(err as any).errors ? ': ' + JSON.stringify((err as any).errors) : ''}`,
              ),
            );
        }
      }
    }
  }
}
