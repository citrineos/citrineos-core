// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IServerNetworkProfileRepository } from '../../../interfaces/repositories.js';
import { ServerNetworkProfile } from '../model/Location/ServerNetworkProfile.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';

export class SequelizeServerNetworkProfileRepository
  extends SequelizeRepository<ServerNetworkProfile>
  implements IServerNetworkProfileRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: ServerNetworkProfile.MODEL_NAME, logger, sequelizeInstance });
  }

  /**
   * Finds or creates a ServerNetworkProfile by id, updates its fields, saves, and returns the instance.
   */
  async upsertServerNetworkProfile(
    websocketServerConfig: any,
    maxCallLengthSeconds: number,
  ): Promise<ServerNetworkProfile> {
    const [serverNetworkProfile] = await ServerNetworkProfile.findOrBuild({
      where: { id: websocketServerConfig.id },
    });
    serverNetworkProfile.host = websocketServerConfig.host;
    serverNetworkProfile.port = websocketServerConfig.port;
    serverNetworkProfile.pingInterval = websocketServerConfig.pingInterval;
    serverNetworkProfile.protocols = websocketServerConfig.protocols;
    serverNetworkProfile.messageTimeout = maxCallLengthSeconds;
    serverNetworkProfile.securityProfile = websocketServerConfig.securityProfile;
    serverNetworkProfile.allowUnknownChargingStations =
      websocketServerConfig.allowUnknownChargingStations;
    serverNetworkProfile.tlsKeyFilePath = websocketServerConfig.tlsKeyFilePath;
    serverNetworkProfile.tlsCertificateChainFilePath =
      websocketServerConfig.tlsCertificateChainFilePath;
    serverNetworkProfile.mtlsCertificateAuthorityKeyFilePath =
      websocketServerConfig.mtlsCertificateAuthorityKeyFilePath;
    serverNetworkProfile.rootCACertificateFilePath =
      websocketServerConfig.rootCACertificateFilePath;
    serverNetworkProfile.tenantId = websocketServerConfig.tenantId;
    serverNetworkProfile.tenantPathMapping = websocketServerConfig.tenantPathMapping;
    await serverNetworkProfile.save();
    return serverNetworkProfile;
  }
}

export default SequelizeServerNetworkProfileRepository;
