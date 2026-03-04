import fastify, { type FastifyInstance } from 'fastify';
import type { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { injectable } from 'inversify';

@injectable()
export class CitrineOSFastifyInstance {
  public readonly instance: FastifyInstance;

  constructor() {
    this.instance = fastify().withTypeProvider<JsonSchemaToTsProvider>();
  }
}
