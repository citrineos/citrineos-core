// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { CrudRepository, OCPP2_0_1 } from '@citrineos/base';
import type { IReservationRepository } from '../../../interfaces/repositories.js';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { EvseType } from '../model/DeviceModel/EvseType.js';
import { Reservation } from '../model/Reservation.js';

export class SequelizeReservationRepository
  extends SequelizeRepository<Reservation>
  implements IReservationRepository
{
  evse: CrudRepository<EvseType>;
  logger: Logger<ILogObj>;

  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: Reservation.MODEL_NAME, logger, sequelizeInstance });
    this.evse = new SequelizeRepository<EvseType>({
      config,
      namespace: EvseType.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async createOrUpdateReservation(
    tenantId: number,
    reserveNowRequest: OCPP2_0_1.ReserveNowRequest,
    ocppConnectionName: string,
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
        ocppConnectionName: ocppConnectionName,
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

  async getNextReservationId(tenantId: number, ocppConnectionName: string): Promise<number> {
    return await this.readNextValue(tenantId, 'id', {
      where: { ocppConnectionName: ocppConnectionName },
    });
  }
}

export default SequelizeReservationRepository;
