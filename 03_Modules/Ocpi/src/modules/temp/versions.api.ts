import {
  AbstractModuleApi,
  AsDataEndpoint,
  getOcpiTagString,
  HttpMethod,
  Namespace,
  OcpiResponse,
  OcpiTag,
  SystemConfig,
} from '@citrineos/base';
import { OcpiModule } from './module';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { VersionDetailsDTO, VersionDTO } from '../../model/Version';
import { AuthorizationHeader } from './schema/authorization.header.schema';
import { VersionService } from './service/version.service';
import { CredentialsRepository } from './repository/credentials.repository';
import { VersionRepository } from './repository/version.repository';
import { VersionsExceptionHandler } from './exceptions/versions.exception.handler';
import { VersionIdParam } from './schema/version.id.param.schema';
import { targetConstructorToSchema } from 'class-validator-jsonschema';
import { AuthorizationSecurity } from '../../util/as.ocpi.endpoint';

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

    this.initFastifyExceptionHandler(
      new VersionsExceptionHandler(this._logger),
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
    AuthorizationSecurity,
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
    AuthorizationSecurity,
  )
  async getVersion(
    request: FastifyRequest<{
      Headers: AuthorizationHeader;
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
