import { CredentialsRepository } from '../repository/credentials.repository';
import { FastifyRequest } from 'fastify';
import { AuthorizationHeaderSchema } from '../schema/authorization.header.schema';
import {
  Credentials,
  HttpStatus,
  OcpiNamespace,
  OcpiResponse,
  Version,
} from '@citrineos/base';
import { VersionsControllerApi } from '../../../apis/VersionsControllerApi';
import { VersionRepository } from '../repository/version.repository';
import { v4 as uuidv4 } from 'uuid';
import { Configuration } from '../../../apis/BaseApi';
import { NotFoundException } from '../exceptions/not.found.exception';
import { ILogObj, Logger } from 'tslog';
import { VersionIdParam } from '../schema/version.id.param.schema';
import { getAuthorizationTokenFromRequest } from '@citrineos/util';

export class CredentialsService {
  constructor(
    private _logger: Logger<ILogObj>,
    private credentialsRepository: CredentialsRepository,
    private versionRepository: VersionRepository,
  ) {}

  async getCredentials(
    request: FastifyRequest<{
      Params: VersionIdParam;
      Headers: AuthorizationHeaderSchema;
    }>,
  ): Promise<OcpiResponse<Credentials>> {
    this._logger.info('getCredentials');
    const credentials = await this.credentialsRepository.readByQuery(
      {
        where: {
          token: getAuthorizationTokenFromRequest(request),
        },
      },
      OcpiNamespace.Credentials,
    );
    if (!credentials) {
      throw new NotFoundException('Credentials not found');
    }
    return OcpiResponse.build(HttpStatus.OK, credentials);
  }

  async postCredentials(
    request: FastifyRequest<{
      Params: VersionIdParam;
      Headers: AuthorizationHeaderSchema;
      Body: Credentials;
    }>,
  ): Promise<OcpiResponse<Credentials>> {
    await this.credentialsRepository.authorizeToken(
      getAuthorizationTokenFromRequest(request),
    );
    await this.getAndUpdateVersions(
      request.body.url,
      request.body.token,
      request.params.versionId,
    );
    return this.updateExistingCredentialsTokenWithNewGeneratedToken(
      getAuthorizationTokenFromRequest(request),
    );
  }

  async putCredentials(
    request: FastifyRequest<{
      Params: VersionIdParam;
      Headers: AuthorizationHeaderSchema;
      Body: Credentials;
    }>,
  ): Promise<OcpiResponse<Credentials>> {
    await this.credentialsRepository.authorizeToken(
      getAuthorizationTokenFromRequest(request),
    );
    await this.getAndUpdateVersions(
      request.body.url,
      request.body.token,
      request.params.versionId,
    );
    return this.updateExistingCredentialsTokenWithNewGeneratedToken(
      getAuthorizationTokenFromRequest(request),
    );
  }

  async deleteCredentials(
    request: FastifyRequest<{
      Params: VersionIdParam;
      Headers: AuthorizationHeaderSchema;
    }>,
  ): Promise<OcpiResponse<void>> {
    try {
      await this.credentialsRepository.deleteAllByQuery(
        {
          where: {
            token: request.query,
          },
        },
        OcpiNamespace.Credentials,
      );
      return OcpiResponse.build(HttpStatus.OK);
    } catch (e) {
      throw new Error('todo'); // todo error handling
    }
  }

  private async updateExistingCredentialsTokenWithNewGeneratedToken(
    oldToken: string,
  ) {
    try {
      const existingCredentials = await this.credentialsRepository.readByKey(
        oldToken,
        OcpiNamespace.Credentials,
      );
      const generateNewToken = uuidv4();
      if (existingCredentials) {
        const updatedCredentials =
          await this.credentialsRepository.updateByQuery(
            {
              token: generateNewToken,
            } as Credentials,
            {
              where: {
                token: oldToken,
              },
            },
            OcpiNamespace.Credentials,
          );
        if (!updatedCredentials) {
          throw new Error('todo'); // todo error handling
        }
        return OcpiResponse.build(HttpStatus.OK, updatedCredentials);
      } else {
        throw new Error('todo'); // todo error handling
      }
    } catch (e) {
      throw new Error('todo'); // todo error handling
    }
  }

  private async getAndUpdateVersions(
    url: string,
    token: string,
    versionId: string,
  ) {
    const versionsControllerApi = new VersionsControllerApi(
      new Configuration({
        basePath: url,
      }),
    );
    const versions = await versionsControllerApi.getVersions({
      authorization: token,
    });
    if (!versions || !versions.data) {
      throw new NotFoundException('Versions not found');
    }
    const version = versions.data?.find((v) => v.version === versionId);
    if (!version) {
      throw new Error('todo'); // todo error handling
    }
    const versionDetails = await versionsControllerApi.getVersion({
      authorization: token,
      versionId: versionId,
    });
    if (!versionDetails) {
      throw new Error('todo'); // todo error handling
    }
    const existingVersion: Version = await this.versionRepository.readByKey(
      versionId,
      OcpiNamespace.Version,
    );
    if (!existingVersion) {
      throw new Error('todo'); // todo error handling
    }
    await this.versionRepository.updateByKey(
      {
        ...existingVersion,
        url: version.url,
        endpoints: versionDetails.data?.endpoints,
      } as Version,
      versionId,
      OcpiNamespace.Version,
    );
  }
}
