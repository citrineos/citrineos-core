// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { OCPP2_request_types } from '@citrineos/types';
import type { ISetNetworkProfileRepository } from '@citrineos/dal';
import { type ILogObj, Logger } from 'tslog';
import { v4 as uuidv4 } from 'uuid';

export interface PersistSetNetworkProfileOptions {
  websocketServerConfigId?: string;
}

export class NetworkProfileService {
  protected _setNetworkProfileRepository: ISetNetworkProfileRepository;
  protected _logger: Logger<ILogObj>;

  constructor({
    setNetworkProfileRepository,
    logger,
  }: {
    setNetworkProfileRepository: ISetNetworkProfileRepository;
    logger: Logger<ILogObj>;
  }) {
    this._setNetworkProfileRepository = setNetworkProfileRepository;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async prepareSetNetworkProfile(
    tenantId: number,
    ocppConnectionNames: string[],
    request: OCPP2_request_types.SetNetworkProfileRequest,
    persistFor?: PersistSetNetworkProfileOptions,
  ): Promise<string> {
    const correlationId = uuidv4();

    if (persistFor) {
      await Promise.all(
        ocppConnectionNames.map((ocppConnectionName) =>
          this._setNetworkProfileRepository.createPending({
            ...request.connectionData,
            ocppConnectionName,
            tenantId,
            correlationId,
            configurationSlot: request.configurationSlot,
            websocketServerConfigId: persistFor.websocketServerConfigId,
            apn: JSON.stringify(request.connectionData.apn),
            vpn: JSON.stringify(request.connectionData.vpn),
          }),
        ),
      );
    }

    return correlationId;
  }
}
