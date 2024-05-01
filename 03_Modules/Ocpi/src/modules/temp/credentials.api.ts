import {
  AbstractModuleApi,
  AsDataEndpoint,
  HttpMethod,
  SystemConfig,
} from '@citrineos/base';
import { OcpiModule } from './module';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { OcpiResponse } from '../../model/OcpiResponse';
import { AuthorizationHeaderSchema } from './schema/authorizationHeaderSchema';
import { Credentials } from '../../model/Credentials';
import { CredentialsService } from './service/credentials.service';
import { VersionIdParamSchema } from './versions.api';
import { CredentialsRepository } from './repository/credentials.repository';
import { VersionRepository } from './repository/version.repository';
import {GlobalExceptionHandler} from './exceptions/global.exception.handler';

export class CredentialsModuleApi extends AbstractModuleApi<OcpiModule> {
  private credentialsService: CredentialsService;

  constructor(
    config: SystemConfig,
    module: OcpiModule,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
    credentialsRepository?: CredentialsRepository,
    versionRepository?: VersionRepository,
  ) {
    super(module, server, logger);

    const finalCredentialsRepository =
      credentialsRepository || new CredentialsRepository(config, this._logger);

    const finalVersionRepository =
      versionRepository || new VersionRepository(config, this._logger);

    this.credentialsService = new CredentialsService(
      finalCredentialsRepository,
      finalVersionRepository,
    );

    this.initFastifyExceptionHandler(new GlobalExceptionHandler(this._logger));
  }

  @AsDataEndpoint(
    '/ocpi/:versionId/credentials',
    HttpMethod.Get,
    undefined,
    undefined,
    VersionIdParamSchema,
    AuthorizationHeaderSchema,
    OcpiResponse<Credentials>,
  )
  async getCredentials(
    request: FastifyRequest<{
      Params: VersionIdParamSchema;
      Headers: AuthorizationHeaderSchema;
    }>,
  ): Promise<OcpiResponse<Credentials>> {
    return this.credentialsService?.getCredentials(request);
  }

  @AsDataEndpoint(
    '/ocpi/:versionId/credentials',
    HttpMethod.Post,
    undefined,
    Credentials,
    VersionIdParamSchema,
    AuthorizationHeaderSchema,
    OcpiResponse<Credentials>,
  )
  async postCredentials(
    request: FastifyRequest<{
      Params: VersionIdParamSchema;
      Headers: AuthorizationHeaderSchema;
      Body: Credentials;
    }>,
  ): Promise<OcpiResponse<Credentials>> {
    return this.credentialsService?.postCredentials(request);
  }

  @AsDataEndpoint(
    '/ocpi/:versionId/credentials',
    HttpMethod.Put,
    undefined,
    Credentials,
    VersionIdParamSchema,
    AuthorizationHeaderSchema,
    OcpiResponse<Credentials>,
  )
  async putCredentials(
    request: FastifyRequest<{
      Params: VersionIdParamSchema;
      Headers: AuthorizationHeaderSchema;
      Body: Credentials;
    }>,
  ): Promise<OcpiResponse<Credentials>> {
    return this.credentialsService?.putCredentials(request);
  }

  @AsDataEndpoint(
    '/ocpi/:versionId/credentials',
    HttpMethod.Delete,
    undefined,
    undefined,
    VersionIdParamSchema,
    AuthorizationHeaderSchema,
    OcpiResponse<void>,
  )
  async deleteCredentials(
    request: FastifyRequest<{
      Params: VersionIdParamSchema;
      Headers: AuthorizationHeaderSchema;
    }>,
  ): Promise<OcpiResponse<void>> {
    return this.credentialsService?.deleteCredentials(request);
  }
}
