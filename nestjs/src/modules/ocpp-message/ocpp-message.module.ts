// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { Module } from '@nestjs/common';
import { OcppMessageAuditService } from '@modules/ocpp-message/ocpp-message-audit.service';
import { OcppMessageRepository } from '@repositories/ocpp-message.repository';

/**
 * OCPP audit trail. Imported by `OcppRouterModule` (which uses the
 * audit service to record every frame). Read-side queries are exposed
 * via Hasura on the `OcppMessages` table directly — no bespoke REST
 * controller needed.
 */
@Module({
  providers: [OcppMessageRepository, OcppMessageAuditService],
  exports: [OcppMessageRepository, OcppMessageAuditService],
})
export class OcppMessageModule {}
