import { VersionRepository } from '../repository/version.repository';
import { FastifyRequest } from 'fastify';
import { AuthorizationHeader } from '../schema/authorizationHeader';
import { HttpStatus } from '@citrineos/base';
import { CredentialsRepository } from '../repository/credentials.repository';
import { VersionIdParam } from '../schema/version.id.param.schema';
import { getAuthorizationTokenFromRequest } from '@citrineos/util/dist/util/swagger';
import { buildOcpiResponse, OcpiResponse } from '../../../util/ocpi.response';
import { Version, VersionDetailsDTO, VersionDTO } from '../../../model/Version';
import { OcpiNamespace } from '../../../util/ocpi.namespace';

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
    const token = getAuthorizationTokenFromRequest(request);
    await this.credentialsRepository.authorizeToken(token);
    const versions: Version[] = await this.versionRepository.readAllByQuery(
      {},
      OcpiNamespace.Version,
    );
    return buildOcpiResponse(
      HttpStatus.OK,
      versions.map((version) => version.toVersionDTO()),
    );
  }

  async getVersion(
    request: FastifyRequest<{
      Headers: AuthorizationHeader;
      Params: VersionIdParam;
    }>,
  ): Promise<OcpiResponse<VersionDetailsDTO>> {
    const token = getAuthorizationTokenFromRequest(request);
    await this.credentialsRepository.authorizeToken(token);
    const version: Version = await this.versionRepository.readByKey(
      request.params.versionId,
      OcpiNamespace.Version,
    );
    return buildOcpiResponse(HttpStatus.OK, version.toVersionDetailsDTO());
  }
}
