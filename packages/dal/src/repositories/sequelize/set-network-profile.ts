// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import type { SetNetworkProfileDto } from '@citrineos/types';
import type {
  ISetNetworkProfileRepository,
  SetNetworkProfileCreateInput,
} from '../repositories.js';
import { SetNetworkProfile } from '../../models/location/set-network-profile.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
import { resolveStationId } from './resolve-station-id.js';

export class SequelizeSetNetworkProfileRepository
  extends SequelizeRepository<SetNetworkProfile>
  implements ISetNetworkProfileRepository
{
  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: SetNetworkProfile.MODEL_NAME, logger, sequelizeInstance });
  }

  async createPending(values: SetNetworkProfileCreateInput): Promise<SetNetworkProfileDto> {
    const tenantId = values.tenantId ?? DEFAULT_TENANT_ID;
    // An unresolvable name leaves "stationId" null, which the column allows.
    const stationId =
      values.stationId ?? (await resolveStationId(tenantId, values.ocppConnectionName));
    return SetNetworkProfile.build({
      stationId,
      tenantId,
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
}

export default SequelizeSetNetworkProfileRepository;
