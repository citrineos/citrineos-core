// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { BaseBroadcaster } from './BaseBroadcaster.js';
import { Service } from 'typedi';
import { CdrsClientApi } from '../trigger/CdrsClientApi.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { Cdr } from '../model/Cdr.js';
import { ModuleId } from '../model/ModuleId.js';
import { InterfaceRole } from '../model/InterfaceRole.js';
import type { TransactionDto } from '@citrineos/base';
import { HttpMethod } from '@citrineos/base';
import { CdrMapper } from '../mapper/index.js';
import { OcpiEmptyResponseSchema } from '../model/OcpiEmptyResponse.js';

@Service()
export class CdrBroadcaster extends BaseBroadcaster {
  constructor(
    readonly logger: Logger<ILogObj>,
    readonly cdrMapper: CdrMapper,
    readonly cdrsClientApi: CdrsClientApi,
  ) {
    super();
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
