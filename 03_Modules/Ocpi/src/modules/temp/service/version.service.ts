import { VersionRepository } from '../repository/version.repository';
import { FastifyRequest } from 'fastify';
import { AuthorizationHeader } from '../schema/authorization.header.schema';
import { OcpiResponse } from '../../../model/OcpiResponse';
import { Version, VersionDetailsDTO, VersionDTO } from '../../../model/Version';
import { CredentialsRepository } from '../repository/credentials.repository';
import { Namespace } from '../util/namespace';
import { HttpStatus } from '../../../util/http.status';
import { VersionIdParam } from '../schema/version.id.param.schema';

export class VersionService {
  constructor(
    private credentialsRepository: CredentialsRepository,
    private versionRepository: VersionRepository,
  ) {}

  async getVersions(
    request: FastifyRequest<{
      Headers: AuthorizationHeader;
    }>,
  ): Promise<OcpiResponse<VersionDTO[]>> {
    try {
      const token = request.headers.Authorization;
      await this.credentialsRepository.validateAuthentication(token);
      const versions: Version[] = await this.versionRepository.readAllByQuery(
        {},
        Namespace.Version,
      );
      return OcpiResponse.build(
        HttpStatus.OK,
        versions.map((version) => version.toVersionDTO()),
      );
    } catch (e) {
      throw new Error('todo'); // todo error handling
    }
  }

  async getVersion(
    request: FastifyRequest<{
      Headers: AuthorizationHeader;
      Params: VersionIdParam;
    }>,
  ): Promise<OcpiResponse<VersionDetailsDTO>> {
    try {
      const token = request.headers.Authorization;
      await this.credentialsRepository.validateAuthentication(token);
      const version: Version = await this.versionRepository.readByKey(
        request.params.versionId,
        Namespace.Version,
      );
      return OcpiResponse.build(HttpStatus.OK, version.toVersionDetailsDTO());
    } catch (e) {
      throw new Error('todo'); // todo error handling
    }
  }
}
