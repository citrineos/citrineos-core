import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import {
  ExceptionHandler,
  HttpStatus,
  UnauthorizedException,
} from '@citrineos/base';
import { NotFoundException } from './not.found.exception';

export class OldGlobalExceptionHandler implements ExceptionHandler {
  constructor(private _logger: Logger<ILogObj>) {}

  handle = (
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    this._logger.error(error);
    if (error instanceof NotFoundException) {
      reply.status(HttpStatus.NOT_FOUND).send(error);
    } else if (error instanceof UnauthorizedException) {
      reply.status(HttpStatus.UNAUTHORIZED).send(error);
    } else {
      reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
    }
  };
}
