// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
} from '@citrineos/base';
import { type HandlerProperties, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import type { IChangeConfigurationRepository } from '@citrineos/dal';

@AsResponseHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.GetConfiguration)
export class GetConfigurationResponseOcpp16Handler extends AbstractHandler {
  protected _changeConfigurationRepository: IChangeConfigurationRepository;

  constructor({
    logger,
    changeConfigurationRepository,
  }: AbstractHandlerDependencies & {
    changeConfigurationRepository: IChangeConfigurationRepository;
  }) {
    super(logger);
    this._changeConfigurationRepository = changeConfigurationRepository;
  }

  async handle(
    message: IMessage<OCPP1_6.GetConfigurationResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('GetConfigurationResponse'),
      message,
      props,
    );

    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;
    const configurations = message.payload.configurationKey;

    if (!configurations || configurations.length === 0) {
      return;
    }

    for (const config of configurations) {
      if (config.key) {
        await this._changeConfigurationRepository.createOrUpdateChangeConfiguration(tenantId, {
          ocppConnectionName,
          key: config.key,
          value: config.value,
          readonly: config.readonly,
        });
      }
    }
  }
}
