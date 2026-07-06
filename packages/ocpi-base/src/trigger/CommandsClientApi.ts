// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseClientApi, MissingRequiredParamException } from './BaseClientApi.js';
import { Inject, Service } from 'typedi';
import type { OcpiEmptyResponse } from '../model/OcpiEmptyResponse.js';
import { OcpiEmptyResponseSchema } from '../model/OcpiEmptyResponse.js';
import { ModuleId } from '../model/ModuleId.js';
import type { ICache, PartnerProfile } from '@citrineos/base';
import { HttpMethod } from '@citrineos/base';
import type { CommandResult } from '../model/CommandResult.js';
import {
  COMMAND_RESPONSE_URL_CACHE_NAMESPACE,
  COMMAND_RESPONSE_URL_CACHE_RESOLVED,
} from '../util/Consts.js';
import { CacheWrapper } from '../util/CacheWrapper.js';

@Service()
export class CommandsClientApi extends BaseClientApi {
  protected cache!: ICache;

  constructor(@Inject() cacheWrapper: CacheWrapper) {
    super();
    this.cache = cacheWrapper.cache;
  }

  CONTROLLER_PATH = ModuleId.Commands;

  getUrl(): string {
    throw new MissingRequiredParamException(`url must be provided by command`);
  }

  async postCommandResult(
    fromCountryCode: string,
    fromPartyId: string,
    toCountryCode: string,
    toPartyId: string,
    partnerProfile: PartnerProfile,
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

    return this.request(
      fromCountryCode,
      fromPartyId,
      toCountryCode,
      toPartyId,
      HttpMethod.Post,
      OcpiEmptyResponseSchema,
      partnerProfile,
      true,
      url,
      body,
    );
  }
}
