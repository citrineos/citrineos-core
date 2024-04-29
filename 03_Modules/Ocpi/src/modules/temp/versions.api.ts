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
import { VersionDetailsDTO, VersionDTO } from '../../model/Version';
import { AuthorizationHeaderSchema } from './schema/authorizationHeaderSchema';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { VersionNumber } from '../../model/VersionNumber';
import { VersionService } from './service/version.service';
import { CredentialsRepository } from './repository/credentials.repository';
import { VersionRepository } from './repository/version.repository';

export class VersionIdParamSchema {
  @IsEnum(VersionNumber)
  @IsNotEmpty()
  versionId!: VersionNumber;
}

export class VersionsModuleApi extends AbstractModuleApi<OcpiModule> {
  private versionService?: VersionService;

  constructor(
    config: SystemConfig,
    ocpiModule: OcpiModule,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
    credentialsRepository?: CredentialsRepository,
    versionRepository?: VersionRepository,
  ) {
    super(ocpiModule, server, logger);

    const finalCredentialsRepository =
      credentialsRepository || new CredentialsRepository(config, this._logger);

    const finalVersionRepository =
      versionRepository || new VersionRepository(config, this._logger);

    this.versionService = new VersionService(
      finalCredentialsRepository,
      finalVersionRepository,
    );
  }

  @AsDataEndpoint(
    '/ocpi/versions',
    HttpMethod.Get,
    undefined,
    undefined,
    undefined,
    AuthorizationHeaderSchema,
    OcpiResponse<VersionDTO[]>, // todo proper pageable object?
  )
  async getVersions(
    request: FastifyRequest<{
      Headers: AuthorizationHeaderSchema;
    }>,
  ): Promise<OcpiResponse<VersionDTO[]>> {
    return this.versionService!.getVersions(request);
  }

  @AsDataEndpoint(
    '/ocpi/:versionId',
    HttpMethod.Get,
    undefined,
    undefined,
    VersionIdParamSchema,
    AuthorizationHeaderSchema,
    OcpiResponse<VersionDetailsDTO>,
  )
  async getVersion(
    request: FastifyRequest<{
      Headers: AuthorizationHeaderSchema;
      Params: VersionIdParamSchema;
    }>,
  ): Promise<OcpiResponse<VersionDetailsDTO>> {
    return this.versionService!.getVersion(request);
  }
}
