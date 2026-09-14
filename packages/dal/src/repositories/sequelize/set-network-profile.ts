// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type { SetNetworkProfileDto } from '@citrineos/types';
import type {
  ISetNetworkProfileRepository,
  SetNetworkProfileCreateInput,
} from '../repositories.js';
import { ChargingStation } from '../../models/location/charging-station.js';
import { SetNetworkProfile } from '../../models/location/set-network-profile.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';

export class SequelizeSetNetworkProfileRepository
  extends SequelizeRepository<SetNetworkProfile>
  implements ISetNetworkProfileRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: SetNetworkProfile.MODEL_NAME, logger, sequelizeInstance });
  }

  async createPending(values: SetNetworkProfileCreateInput): Promise<SetNetworkProfileDto> {
    const tenantId = values.tenantId ?? DEFAULT_TENANT_ID;
    const stationId = await this.resolveStationId(tenantId, values.ocppConnectionName ?? undefined);
    return SetNetworkProfile.build({
      stationId,
      tenantId,
      ocppConnectionName: values.ocppConnectionName ?? undefined,
      correlationId: values.correlationId ?? undefined,
      websocketServerConfigId: values.websocketServerConfigId ?? undefined,
      configurationSlot: values.configurationSlot ?? undefined,
      ocppVersion: values.ocppVersion ?? undefined,
      ocppTransport: values.ocppTransport ?? undefined,
      ocppCsmsUrl: values.ocppCsmsUrl ?? undefined,
      messageTimeout: values.messageTimeout ?? undefined,
      securityProfile: values.securityProfile ?? undefined,
      ocppInterface: values.ocppInterface ?? undefined,
      apn: values.apn ?? undefined,
      vpn: values.vpn ?? undefined,
    } as Parameters<typeof SetNetworkProfile.build>[0]).save();
  }

  private async resolveStationId(
    tenantId: number,
    ocppConnectionName?: string,
  ): Promise<number | undefined> {
    if (!ocppConnectionName) {
      return undefined;
    }
    const station = await ChargingStation.findOne({
      where: { ocppConnectionName, tenantId },
      attributes: ['id'],
    });
    return station?.id;
  }
}

export default SequelizeSetNetworkProfileRepository;
