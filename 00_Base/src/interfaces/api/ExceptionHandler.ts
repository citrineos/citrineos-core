import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

export interface ExceptionHandler {
  handle(error: FastifyError, request: FastifyRequest, reply: FastifyReply): void;
}
