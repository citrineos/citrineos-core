// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig } from '@citrineos/base';
import { SequelizeRepository } from './Base.js';
import { Sequelize } from 'sequelize-typescript';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { ServerNetworkProfile } from '../model/index.js';
import type { IServerNetworkProfileRepository } from '../../../interfaces/index.js';

export class SequelizeServerNetworkProfileRepository
  extends SequelizeRepository<ServerNetworkProfile>
  implements IServerNetworkProfileRepository
{
  constructor(config: BootstrapConfig, logger?: Logger<ILogObj>, sequelizeInstance?: Sequelize) {
    super(config, ServerNetworkProfile.MODEL_NAME, logger, sequelizeInstance);
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
    serverNetworkProfile.protocol = websocketServerConfig.protocol;
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
    await serverNetworkProfile.save();
    return serverNetworkProfile;
  }
}
