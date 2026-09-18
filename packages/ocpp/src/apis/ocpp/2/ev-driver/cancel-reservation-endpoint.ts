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
import type { IReservationRepository } from '@citrineos/dal';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  reservationRepository: IReservationRepository;
}

export class CancelReservationEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointMetadata = {
    action: OCPP_CallAction.CancelReservation,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.EVDriver,
    bodySchema: ocpp2Schema('CancelReservationRequestSchema'),
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
    request: OCPP2_request_types.CancelReservationRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation[]> {
    try {
      const reservations = await Promise.all(
        identifiers.map((ocppConnectionName) =>
          this._reservationRepository.findByStationAndReservationId(
            tenantId,
            ocppConnectionName,
            request.reservationId,
          ),
        ),
      );

      const missingReservations = identifiers.filter((_, index) => !reservations[index]);
      if (missingReservations.length > 0) {
        throw new Error(
          `Reservation ${request.reservationId} not found for station IDs: ${missingReservations.join(
            ', ',
          )}.`,
        );
      }

      return Promise.all(
        identifiers.map((ocppConnectionName) =>
          this._ocppSender.sendCall({
            ocppConnectionName,
            tenantId,
            protocol: version,
            action: OCPP_CallAction.CancelReservation,
            eventGroup: EventGroup.EVDriver,
            payload: request,
            callbackUrl,
          }),
        ),
      );
    } catch (error) {
      this._logger.error(
        `CancelReservation request failed: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
      );
      return identifiers.map(() => ({
        success: false,
        payload: error instanceof Error ? error.message : JSON.stringify(error),
      }));
    }
  }
}
