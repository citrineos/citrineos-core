// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractMessageEndpointDependencies,
  type IMessageConfirmation,
  type IMessageEndpointDeclaration,
  type IOcppSender,
  type OCPP2_request_types,
  AbstractMessageEndpoint,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import { EventGroup, OCPP_CallAction, type OCPPVersion } from '@citrineos/types';
import { validateLanguageTag } from '@util/index.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
}

export class SetDisplayMessageEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointDeclaration = {
    action: OCPP_CallAction.SetDisplayMessage,
    protocols: OCPP2_PROTOCOLS,
    endpointPrefixConfigKey: 'configuration',
    bodySchema: ocpp2Schema('SetDisplayMessageRequestSchema'),
  };

  private readonly _ocppSender: IOcppSender;

  constructor({ logger, ocppSender }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
  }

  async handle(
    identifiers: string[],
    request: OCPP2_request_types.SetDisplayMessageRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation[]> {
    const messageInfo = request.message;

    const languageTag = messageInfo.message.language;
    if (languageTag && !validateLanguageTag(languageTag)) {
      const errorMsg =
        'Language shall be specified as RFC-5646 tags, example: en-US for US English.';
      this._logger.error(errorMsg);
      return [{ success: false, payload: errorMsg }];
    }

    if (!messageInfo.startDateTime) {
      messageInfo.startDateTime = new Date().toISOString();
    }

    return Promise.all(
      identifiers.map((ocppConnectionName) =>
        this._ocppSender.sendCall({
          ocppConnectionName,
          tenantId,
          protocol: version,
          action: OCPP_CallAction.SetDisplayMessage,
          eventGroup: EventGroup.Configuration,
          payload: request,
          callbackUrl,
        }),
      ),
    );
  }
}
