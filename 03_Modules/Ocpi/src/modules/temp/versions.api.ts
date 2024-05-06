import {
  AbstractModuleApi,
  AsDataEndpoint,
  AuthorizationSecurityList,
  getOcpiTagString,
  HttpMethod,
  Namespace,
  OcpiResponse,
  OcpiTag,
  SystemConfig,
  VersionDetailsDTO,
  VersionDTO,
} from '@citrineos/base';
import { OcpiModule } from './module';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { AuthorizationHeaderSchema } from './schema/authorization.header.schema';
import { VersionService } from './service/version.service';
import { CredentialsRepository } from './repository/credentials.repository';
import { VersionRepository } from './repository/version.repository';
import { VersionIdParam } from './schema/version.id.param.schema';
import { targetConstructorToSchema } from 'class-validator-jsonschema';

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
    targetConstructorToSchema(AuthorizationHeaderSchema),
    targetConstructorToSchema(OcpiResponse<VersionDTO[]>), // todo proper pageable object?
    getOcpiTagString(OcpiTag.Versions),
    AuthorizationSecurityList,
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
    targetConstructorToSchema(VersionIdParam),
    targetConstructorToSchema(AuthorizationHeaderSchema),
    targetConstructorToSchema(OcpiResponse<VersionDetailsDTO>),
    getOcpiTagString(OcpiTag.Versions),
    AuthorizationSecurityList,
  )
  async getVersion(
    request: FastifyRequest<{
      Headers: AuthorizationHeaderSchema;
      Params: VersionIdParam;
    }>,
  ): Promise<OcpiResponse<VersionDetailsDTO>> {
    return this.versionService!.getVersion(request);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: Namespace | string): string {
    return super._toDataPath(input, 'versions');
  }
}
