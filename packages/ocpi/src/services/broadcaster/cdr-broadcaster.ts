// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseBroadcaster } from './base-broadcaster.js';
import type { CdrsClientApi } from '../../transport/trigger/cdrs-client-api.js';
import type { ILogObj, Logger } from 'tslog';
import type { Cdr } from '../../types/cdr.js';
import { ModuleId } from '../../types/module-id.js';
import { InterfaceRole } from '../../types/interface-role.js';
import { type TransactionDto, HttpMethod } from '@citrineos/types';
import type { CdrMapper } from '../../mappers/index.js';
import type { OcpiDependencies } from '../../server/dependencies.js';
import { OcpiEmptyResponseSchema } from '../../types/ocpi-empty-response.js';

export interface CdrBroadcasterDependencies extends OcpiDependencies {
  cdrMapper: CdrMapper;
  cdrsClientApi: CdrsClientApi;
}

export class CdrBroadcaster extends BaseBroadcaster {
  readonly logger: Logger<ILogObj>;
  readonly cdrMapper: CdrMapper;
  readonly cdrsClientApi: CdrsClientApi;

  constructor({ logger, cdrMapper, cdrsClientApi }: CdrBroadcasterDependencies) {
    super();
    this.logger = logger;
    this.cdrMapper = cdrMapper;
    this.cdrsClientApi = cdrsClientApi;
  }

  async broadcastPostCdr(transactionDto: TransactionDto): Promise<void> {
    const cdrs: Cdr[] = await this.cdrMapper.mapTransactionsToCdrs([transactionDto]);
    if (cdrs.length === 0) {
      this.logger.warn(`No CDRs generated for Transaction: ${transactionDto.transactionId}`);
      return;
    }
    const cdrDto = cdrs[0];

    try {
      await this.cdrsClientApi.broadcastToClients({
        cpoCountryCode: cdrDto.country_code!,
        cpoPartyId: cdrDto.party_id!,
        moduleId: ModuleId.Cdrs,
        interfaceRole: InterfaceRole.RECEIVER,
        httpMethod: HttpMethod.Post,
        schema: OcpiEmptyResponseSchema,
        body: cdrDto,
      });
    } catch (e) {
      this.logger.error(`broadcastPostCdr failed for CDR ${cdrDto.id}`, e);
    }
  }
}
