import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { ExceptionHandler } from '@citrineos/base';

export class VersionsExceptionHandler implements ExceptionHandler {
  constructor(private _logger: Logger<ILogObj>) {}

  handle = (
    error: FastifyError,
    request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    this._logger.error(error);
    reply.status(500).send(error);
  };
}
