import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { ExceptionHandler } from '@citrineos/base';
import { NotFoundException } from './not.found.exception';
import { HttpStatus } from '../../../util/http.status';

export class CredentialsExceptionHandler implements ExceptionHandler {
  constructor(private _logger: Logger<ILogObj>) {}

  handle = (
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    this._logger.error(error);
    if (error instanceof NotFoundException) {
      reply.status(HttpStatus.NOT_FOUND).send(error);
    }
    reply.status(500).send(error);
  };
}
