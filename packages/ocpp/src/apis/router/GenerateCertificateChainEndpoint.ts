// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { WebsocketNetworkConnection } from '@/transport/index.js';
import {
  type AbstractEndpointDependencies,
  type ICommandEndpointMetadata,
  type IFileStorage,
  AbstractEndpoint,
  BadRequestError,
  NotFoundError,
} from '@citrineos/base';
import {
  type CertificateDto,
  type SystemConfig,
  type WebsocketServerConfig,
  HttpMethod,
} from '@citrineos/types';
import type {
  GenerateCertificateChainQueryString,
  GenerateCertificateChainRequest,
  IServerNetworkProfileRepository,
} from '@citrineos/dal';
import {
  CertificateGenerationScope,
  GenerateCertificateChainQuerySchema,
  GenerateCertificateChainSchema,
} from '@citrineos/dal';
import type { InstallCertificateHelperService } from '@/services/certificate/installCertificateHelperService.js';
import type { FastifyRequest } from 'fastify';

interface Deps extends AbstractEndpointDependencies {
  config: SystemConfig;
  networkConnection: WebsocketNetworkConnection;
  fileStorage: IFileStorage;
  serverNetworkProfileRepository: IServerNetworkProfileRepository;
  installCertificateHelperService: InstallCertificateHelperService;
}

type Route = {
  Body: GenerateCertificateChainRequest;
  Querystring: GenerateCertificateChainQueryString;
};

type CertificateFilePaths = {
  tlsKeyFilePath: string;
  tlsCertificateChainFilePath: string;
  mtlsCertificateAuthorityKeyFilePath?: string;
  rootCACertificateFilePath?: string;
};

export class GenerateCertificateChainEndpoint extends AbstractEndpoint<Route> {
  static readonly route: ICommandEndpointMetadata = {
    method: HttpMethod.Post,
    path: '/certificateChain',
    querySchema: GenerateCertificateChainQuerySchema,
    bodySchema: GenerateCertificateChainSchema,
  };

  private readonly _config: SystemConfig;
  private readonly _networkConnection: WebsocketNetworkConnection;
  private readonly _websocketConfigs: WebsocketServerConfig[];
  private readonly _fileStorage: IFileStorage;
  private readonly _serverNetworkProfileRepository: IServerNetworkProfileRepository;
  private readonly _installCertificateHelperService: InstallCertificateHelperService;

  constructor({
    logger,
    config,
    networkConnection,
    fileStorage,
    serverNetworkProfileRepository,
    installCertificateHelperService,
  }: Deps) {
    super(logger);
    this._config = config;
    this._networkConnection = networkConnection;
    this._websocketConfigs = this._networkConnection.getWebsocketServers();
    this._fileStorage = fileStorage;
    this._serverNetworkProfileRepository = serverNetworkProfileRepository;
    this._installCertificateHelperService = installCertificateHelperService;
  }

  async handle(
    request: FastifyRequest<Route>,
  ): Promise<
    | { serverIds: string[]; certificates: CertificateDto[] }[]
    | { filePaths: CertificateFilePaths; certificates: CertificateDto[] }
  > {
    const tenantId = request.query.tenantId;

    if (request.query.serverId === undefined) {
      const scope = request.body.generationScope ?? CertificateGenerationScope.FullChain;
      if (scope !== CertificateGenerationScope.FullChain) {
        throw new BadRequestError(
          `generationScope ${scope} requires a serverId (it reuses an existing server's root/subCA). Omit generationScope or set it to FullChain to generate a standalone chain.`,
        );
      }
      const { certificates, filePaths } =
        await this._installCertificateHelperService.generateStandaloneFullChain(
          tenantId,
          request.body,
        );
      return { filePaths, certificates };
    }

    const serverIds = Array.isArray(request.query.serverId)
      ? request.query.serverId
      : [request.query.serverId];

    const websocketConfigs = serverIds.map((serverId) => {
      const websocketConfig = this._websocketConfigs.find((ws) => ws.id === serverId);
      if (!websocketConfig) {
        throw new NotFoundError(`Websocket configuration with id ${serverId} not found`);
      }
      if (websocketConfig.securityProfile < 2) {
        throw new BadRequestError(
          `Websocket configuration with id ${serverId} is not TLS-enabled (securityProfile ${websocketConfig.securityProfile}); nothing to regenerate.`,
        );
      }
      return websocketConfig;
    });

    const generationScope = request.body.generationScope ?? CertificateGenerationScope.Leaf;
    const groups = await this._installCertificateHelperService.groupServersForGeneration(
      tenantId,
      websocketConfigs,
      generationScope,
    );

    const results: { serverIds: string[]; certificates: CertificateDto[] }[] = [];
    for (const group of groups) {
      const [representative] = group;
      const { certificates, filePaths } =
        await this._installCertificateHelperService.generateCertificateChain(
          tenantId,
          representative,
          request.body,
        );

      for (const websocketConfig of group) {
        Object.assign(
          websocketConfig,
          this._filePathsForSecurityProfile(filePaths, websocketConfig.securityProfile),
        );
      }
      await this._networkConnection.saveWebsocketServersConfig(this._websocketConfigs);
      for (const websocketConfig of group) {
        await this._serverNetworkProfileRepository.upsertServerNetworkProfile(
          { ...websocketConfig, ...filePaths },
          this._config.timeouts.maxCallLengthSeconds,
        );
        await this._networkConnection.reloadTlsCertificates?.(websocketConfig.id);
      }

      results.push({ serverIds: group.map((ws) => ws.id), certificates });
    }

    return results;
  }

  private _filePathsForSecurityProfile(
    filePaths: CertificateFilePaths,
    securityProfile: number,
  ): Partial<CertificateFilePaths> {
    const result: Partial<CertificateFilePaths> = {
      tlsKeyFilePath: filePaths.tlsKeyFilePath,
      tlsCertificateChainFilePath: filePaths.tlsCertificateChainFilePath,
    };
    if (filePaths.rootCACertificateFilePath !== undefined) {
      result.rootCACertificateFilePath = filePaths.rootCACertificateFilePath;
    }
    if (securityProfile >= 3 && filePaths.mtlsCertificateAuthorityKeyFilePath !== undefined) {
      result.mtlsCertificateAuthorityKeyFilePath = filePaths.mtlsCertificateAuthorityKeyFilePath;
    }
    return result;
  }
}
