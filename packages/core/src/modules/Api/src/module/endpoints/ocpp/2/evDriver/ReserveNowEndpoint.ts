// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractMessageEndpointDependencies,
  type IMessageConfirmation,
  type IMessageEndpointMetadata,
  type IOcppSender,
  AbstractMessageEndpoint,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import {
  EventGroup,
  OCPP_CallAction,
  type OCPPVersion,
  type OCPP2_request_types,
} from '@citrineos/types';
import type { IReservationRepository } from '@dal/interfaces/repositories.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  reservationRepository: IReservationRepository;
}

export class ReserveNowEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointMetadata = {
    action: OCPP_CallAction.ReserveNow,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.EVDriver,
    bodySchema: ocpp2Schema('ReserveNowRequestSchema'),
  };

  private readonly _ocppSender: IOcppSender;
  private readonly _reservationRepository: IReservationRepository;

  constructor({ logger, ocppSender, reservationRepository }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
    this._reservationRepository = reservationRepository;
  }

  async handle(
    identifiers: string[],
    request: OCPP2_request_types.ReserveNowRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation[]> {
    const results: IMessageConfirmation[] = [];

    for (const ocppConnectionName of identifiers) {
      try {
        const storedReservation = await this._reservationRepository.createOrUpdateReservation(
          tenantId,
          request,
          ocppConnectionName,
          false,
        );

        if (!storedReservation) {
          results.push({
            success: false,
            payload: `Reservation could not be stored for station: ${ocppConnectionName}.`,
          });
          continue;
        }

        results.push(
          await this._ocppSender.sendCall({
            ocppConnectionName,
            tenantId,
            protocol: version,
            action: OCPP_CallAction.ReserveNow,
            eventGroup: EventGroup.EVDriver,
            payload: request,
            callbackUrl,
          }),
        );
      } catch (error) {
        results.push({
          success: false,
          payload: error instanceof Error ? error.message : JSON.stringify(error),
        });
      }
    }

    return results;
  }
}
