import {
  AbstractModuleApi,
  AsDataEndpoint,
  AuthorizationSecurityList,
  HttpMethod,
  SystemConfig,
} from '@citrineos/base';
import { OcpiModule } from './module';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { AuthorizationHeader } from './schema/authorizationHeader';
import { VersionService } from './service/version.service';
import { CredentialsRepository } from './repository/credentials.repository';
import { VersionRepository } from './repository/version.repository';
import { VersionIdParam } from './schema/version.id.param.schema';
import { targetConstructorToSchema } from 'class-validator-jsonschema';
import { OcpiResponse } from '../../util/ocpi.response';
import { getOcpiTagString, OcpiTag } from '../../util/ocpi.tag';
import { VersionDetailsDTO, VersionDTO } from '../../model/Version';

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
    targetConstructorToSchema(AuthorizationHeader),
    targetConstructorToSchema(OcpiResponse<VersionDTO[]>), // todo proper pageable object?
    getOcpiTagString(OcpiTag.Versions),
    AuthorizationSecurityList,
  )
  async getVersions(
    request: FastifyRequest<{
      Headers: AuthorizationHeader;
    }>,
  ): Promise<OcpiResponse<VersionDTO[]>> {
    return this.versionService!.getVersions(request);
  }

  @AsDataEndpoint(
    '/ocpi/:versionId',
    HttpMethod.Get,
    undefined,
    undefined,
    targetConstructorToSchema(VersionIdParam),
    targetConstructorToSchema(AuthorizationHeader),
    targetConstructorToSchema(OcpiResponse<VersionDetailsDTO>),
    getOcpiTagString(OcpiTag.Versions),
    AuthorizationSecurityList,
  )
  async getVersion(
    request: FastifyRequest<{
      Headers: AuthorizationHeader;
      Params: VersionIdParam;
    }>,
  ): Promise<OcpiResponse<VersionDetailsDTO>> {
    return this.versionService!.getVersion(request);
  }
}
