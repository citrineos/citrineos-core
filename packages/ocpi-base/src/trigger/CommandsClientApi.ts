// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseClientApi, MissingRequiredParamException } from './BaseClientApi.js';
import type { OcpiEmptyResponse } from '../model/OcpiEmptyResponse.js';
import { OcpiEmptyResponseSchema } from '../model/OcpiEmptyResponse.js';
import { ModuleId } from '../model/ModuleId.js';
import type { ICache } from '@citrineos/base';
import { type TenantPartnerDto, HttpMethod } from '@citrineos/types';
import type { CommandResult } from '../model/CommandResult.js';
import {
  COMMAND_RESPONSE_URL_CACHE_NAMESPACE,
  COMMAND_RESPONSE_URL_CACHE_RESOLVED,
} from '../util/Consts.js';
import type { CacheWrapper } from '../util/CacheWrapper.js';
import type { OcpiClientApiDependencies } from '../dependencies.js';

export interface CommandsClientApiDependencies extends OcpiClientApiDependencies {
  cacheWrapper: CacheWrapper;
}

export class CommandsClientApi extends BaseClientApi {
  protected cache: ICache;

  constructor(dependencies: CommandsClientApiDependencies) {
    super(dependencies);
    this.cache = dependencies.cacheWrapper.cache;
  }

  CONTROLLER_PATH = ModuleId.Commands;

  getUrl(): string {
    throw new MissingRequiredParamException(`url must be provided by command`);
  }

  async postCommandResult(
    tenantPartner: TenantPartnerDto,
    url: string, // Provided in the command
    body: CommandResult,
    commandId: string,
  ): Promise<OcpiEmptyResponse> {
    await this.cache.set(
      commandId,
      COMMAND_RESPONSE_URL_CACHE_RESOLVED,
      COMMAND_RESPONSE_URL_CACHE_NAMESPACE,
      5, // Flush the resolution after a few seconds so that it doesn't stay in cache indefinitely
    );

    // A CommandResult flows from the CPO (us) to the eMSP counterparty, so the OCPI
    // routing headers must be from=CPO, to=eMSP. tenantPartner.tenant is the CPO;
    // tenantPartner itself is the eMSP. Deriving the direction here (rather than at each
    // call site) keeps it a single source of truth and prevents the pairs being inverted.
    return this.request(
      tenantPartner.tenant!.countryCode!, // from = CPO
      tenantPartner.tenant!.partyId!,
      tenantPartner.countryCode!, // to = eMSP
      tenantPartner.partyId!,
      HttpMethod.Post,
      OcpiEmptyResponseSchema,
      tenantPartner.partnerProfileOCPI!,
      true,
      url,
      body,
    );
  }
}
