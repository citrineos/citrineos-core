// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CrudRepository, OCPP2_0_1, BootstrapConfig } from '@citrineos/base';
import { IReservationRepository } from '../../../interfaces';
import { SequelizeRepository } from './Base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import { Reservation } from '../model/Reservation';
import { Evse } from '../model/DeviceModel';

export class SequelizeReservationRepository
  extends SequelizeRepository<Reservation>
  implements IReservationRepository
{
  evse: CrudRepository<Evse>;
  logger: Logger<ILogObj>;

  constructor(
    config: BootstrapConfig,
    logger?: Logger<ILogObj>,
    sequelizeInstance?: Sequelize,
    evse?: CrudRepository<Evse>,
  ) {
    super(config, Reservation.MODEL_NAME, logger, sequelizeInstance);
    this.evse = evse
      ? evse
      : new SequelizeRepository<Evse>(config, Evse.MODEL_NAME, logger, sequelizeInstance);

    this.logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async createOrUpdateReservation(
    tenantId: number,
    reserveNowRequest: OCPP2_0_1.ReserveNowRequest,
    stationId: string,
    isActive?: boolean,
  ): Promise<Reservation | undefined> {
    let evseDBId: number | null = null;
    if (reserveNowRequest.evseId) {
      const [evse] = await this.evse.readAllByQuery(tenantId, {
        where: {
          id: reserveNowRequest.evseId,
          connectorId: null,
        },
      });
      if (!evse) {
        this.logger.error(`Could not find evse with id ${reserveNowRequest.evseId}`);
        return undefined;
      } else {
        evseDBId = evse.databaseId;
      }
    }

    const [storedReservation, created] = await this.readOrCreateByQuery(tenantId, {
      where: {
        tenantId,
        // unique constraints
        stationId,
        id: reserveNowRequest.id,
      },
      defaults: {
        expiryDateTime: reserveNowRequest.expiryDateTime,
        connectorType: reserveNowRequest.connectorType,
        evseId: evseDBId,
        idToken: reserveNowRequest.idToken,
        groupIdToken: reserveNowRequest.groupIdToken ? reserveNowRequest.groupIdToken : null,
      },
    });

    if (!created) {
      return await this.updateByKey(
        tenantId,
        {
          expiryDateTime: reserveNowRequest.expiryDateTime,
          connectorType: reserveNowRequest.connectorType ?? null,
          evseId: evseDBId,
          idToken: reserveNowRequest.idToken,
          groupIdToken: reserveNowRequest.groupIdToken ?? null,
          isActive,
        },
        storedReservation.databaseId.toString(),
      );
    } else {
      return storedReservation;
    }
  }

  async getNextReservationId(tenantId: number, stationId: string): Promise<number> {
    return await this.readNextValue(tenantId, 'id', { where: { stationId } });
  }
}
