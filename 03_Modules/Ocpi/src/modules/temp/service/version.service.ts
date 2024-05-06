import { VersionRepository } from '../repository/version.repository';
import { FastifyRequest } from 'fastify';
import { AuthorizationHeaderSchema } from '../schema/authorization.header.schema';
import {
  HttpStatus,
  OcpiResponse,
  Version,
  VersionDetailsDTO,
  VersionDTO,
} from '@citrineos/base';
import { CredentialsRepository } from '../repository/credentials.repository';
import { OcpiNamespace } from '@citrineos/base';
import { VersionIdParam } from '../schema/version.id.param.schema';
import { getAuthorizationTokenFromRequest } from '@citrineos/util/dist/util/swagger';

export class VersionService {
  constructor(
    private credentialsRepository: CredentialsRepository,
    private versionRepository: VersionRepository,
  ) {}

  async getVersions(
    request: FastifyRequest<{
      Headers: AuthorizationHeaderSchema;
    }>,
  ): Promise<OcpiResponse<VersionDTO[]>> {
    const token = getAuthorizationTokenFromRequest(request);
    await this.credentialsRepository.authorizeToken(token);
    const versions: Version[] = await this.versionRepository.readAllByQuery(
      {},
      OcpiNamespace.Version,
    );
    return OcpiResponse.build(
      HttpStatus.OK,
      versions.map((version) => version.toVersionDTO()),
    );
  }

  async getVersion(
    request: FastifyRequest<{
      Headers: AuthorizationHeaderSchema;
      Params: VersionIdParam;
    }>,
  ): Promise<OcpiResponse<VersionDetailsDTO>> {
    const token = getAuthorizationTokenFromRequest(request);
    await this.credentialsRepository.authorizeToken(token);
    const version: Version = await this.versionRepository.readByKey(
      request.params.versionId,
      OcpiNamespace.Version,
    );
    return OcpiResponse.build(HttpStatus.OK, version.toVersionDetailsDTO());
  }
}
