// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  CrudRepository,
  ReserveNowRequest,
  SystemConfig,
} from '@citrineos/base';
import { IAuthorizationRepository, IReservationRepository } from '../../../interfaces';
import { SequelizeRepository } from './Base';
import { Sequelize } from 'sequelize-typescript';
import { ILogObj, Logger } from 'tslog';
import { Reservation } from '../model/Reservation';
import { Evse } from '../model/DeviceModel';
import { AdditionalInfo, IdToken } from '../model/Authorization';
import { SequelizeAuthorizationRepository } from './Authorization';

export class SequelizeReservationRepository extends SequelizeRepository<Reservation> implements IReservationRepository {
  evse: CrudRepository<Evse>;
  authorization: IAuthorizationRepository;
  idToken: CrudRepository<IdToken>;
  additionalInfo: CrudRepository<AdditionalInfo>;
  logger: Logger<ILogObj>

  constructor(
    config: SystemConfig,
    logger?: Logger<ILogObj>,
    namespace = Reservation.MODEL_NAME,
    sequelizeInstance?: Sequelize,
    evse?: CrudRepository<Evse>,
    authorization?: IAuthorizationRepository,
    idToken?: CrudRepository<IdToken>,
    additionalInfo?: CrudRepository<AdditionalInfo>,
  ) {
    super(config, namespace, logger, sequelizeInstance);
    this.evse = evse ? evse : new SequelizeRepository<Evse>(config, Evse.MODEL_NAME, logger, sequelizeInstance);
    this.authorization = authorization ? authorization : new SequelizeAuthorizationRepository(config, logger);
    this.idToken = idToken ? idToken : new SequelizeRepository<IdToken>(config, IdToken.MODEL_NAME, logger, sequelizeInstance);
    this.additionalInfo = additionalInfo
      ? additionalInfo
      : new SequelizeRepository<AdditionalInfo>(config, AdditionalInfo.MODEL_NAME, logger, sequelizeInstance);

    this.logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async createOrUpdateReservation(reserveNowRequest: ReserveNowRequest, stationId: string): Promise<Reservation | undefined> {
    let evse: Evse | undefined;
    if (reserveNowRequest.evseId) {
      [evse] = await this.evse.readAllByQuery({
        where: {
          id: reserveNowRequest.evseId
        }
      })
      if (!evse) {
        this.logger.error(`Could not find evse with id ${reserveNowRequest.evseId}`);
        return undefined;
      }
    }

    let reservation: Reservation | undefined;

    const transaction = await this.s.transaction();
    try {
      const storedIdToken = await this.authorization.updateIdToken(reserveNowRequest.idToken);
      let groupIdToken: IdToken | undefined;
      if (reserveNowRequest.groupIdToken) {
        groupIdToken = await this.authorization.updateIdToken(reserveNowRequest.groupIdToken);
      }

      const [storedReservation, created] = await this.readOrCreateByQuery({
        where: { // unique constraints
          stationId,
          id: reserveNowRequest.id,
        },
        defaults: {
          expiryDateTime: reserveNowRequest.expiryDateTime,
          connectorType: reserveNowRequest.connectorType,
          evseId: evse?.id,
          idTokenId: storedIdToken.id,
          groupIdTokenId: groupIdToken?.id,
        },
        include: [
          {
            model: IdToken,
            include: [AdditionalInfo],
          },
          {
            model: Evse
          }
        ],
      });

      if (!created) {
        reservation = await this.updateByKey({
          expiryDateTime: reserveNowRequest.expiryDateTime,
          connectorType: reserveNowRequest.connectorType,
          evseId: evse?.id,
          idTokenId: storedIdToken.id,
          groupIdTokenId: groupIdToken ? groupIdToken.id : null,
        }, String(storedReservation.id));
      } else {
        reservation = storedReservation;
      }

      await transaction.commit();
    } catch (error) {
      this.logger.error(error);
      await transaction.rollback();
    }

    return reservation;
  }
}
