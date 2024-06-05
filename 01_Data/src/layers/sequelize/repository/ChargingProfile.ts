// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ChargingProfileType, CrudRepository, NotifyEVChargingNeedsRequest, SystemConfig } from '@citrineos/base';
import { SequelizeRepository } from './Base';
import { IChargingProfileRepository } from '../../../interfaces';
import { Evse } from '../model/DeviceModel';
import { Sequelize } from 'sequelize-typescript';
import { Logger, ILogObj } from 'tslog';
import { ChargingNeeds, ChargingProfile, ChargingSchedule, SalesTariff } from '../model/ChargingProfile';
import { Transaction } from '../model/TransactionEvent';

export class SequelizeChargingProfileRepository extends SequelizeRepository<ChargingProfile> implements IChargingProfileRepository {
  chargingNeeds: CrudRepository<ChargingNeeds>;
  chargingSchedule: CrudRepository<ChargingSchedule>;
  salesTariff: CrudRepository<SalesTariff>;
  transaction: CrudRepository<Transaction>;
  evse: CrudRepository<Evse>;

  constructor(
    config: SystemConfig,
    logger?: Logger<ILogObj>,
    sequelizeInstance?: Sequelize,
    chargingNeeds?: CrudRepository<ChargingNeeds>,
    chargingSchedule?: CrudRepository<ChargingSchedule>,
    salesTariff?: CrudRepository<SalesTariff>,
    transaction?: CrudRepository<Transaction>,
    evse?: CrudRepository<Evse>,
  ) {
    super(config, ChargingProfile.MODEL_NAME, logger, sequelizeInstance);
    this.chargingNeeds = chargingNeeds ? chargingNeeds : new SequelizeRepository<ChargingNeeds>(config, ChargingNeeds.MODEL_NAME, logger, sequelizeInstance);
    this.chargingSchedule = chargingSchedule ? chargingSchedule : new SequelizeRepository<ChargingSchedule>(config, ChargingSchedule.MODEL_NAME, logger, sequelizeInstance);
    this.evse = evse ? evse : new SequelizeRepository<Evse>(config, Evse.MODEL_NAME, logger, sequelizeInstance);
    this.salesTariff = salesTariff ? salesTariff : new SequelizeRepository<SalesTariff>(config, SalesTariff.MODEL_NAME, logger, sequelizeInstance);
    this.transaction = transaction ? transaction : new SequelizeRepository<Transaction>(config, Transaction.MODEL_NAME, logger, sequelizeInstance);
  }

  async existChargingNeedsByTransactionDBId(transactionDataBaseId: number): Promise<number> {
    return await this.chargingNeeds.existByQuery({
      where: {
        transactionDatabaseId: transactionDataBaseId,
      },
    });
  }

  async createOrUpdateChargingProfile(chargingProfile: ChargingProfileType, evseDBId: number): Promise<ChargingProfile> {
    const [savedChargingProfile, profileCreated] = await this.readOrCreateByQuery({
      where: {
        evseDatabaseId: evseDBId,
        id: chargingProfile.id,
      },
      defaults: {
        ...chargingProfile,
        transactionDatabaseId: chargingProfile.transactionId,
      },
    });
    if (!profileCreated) {
      await this.updateByKey(
        {
          ...chargingProfile,
          transactionDatabaseId: chargingProfile.transactionId,
          evseDatabaseId: evseDBId,
        },
        savedChargingProfile.databaseId.toString(),
      );
      // delete existed charging schedules and sales tariff
      const deletedChargingSchedules = await this.chargingSchedule.deleteAllByQuery({
        where: {
          chargingProfileDatabaseId: savedChargingProfile.databaseId,
        },
      });
      for (const deletedSchedule of deletedChargingSchedules) {
        await this.salesTariff.deleteAllByQuery({
          where: {
            chargingScheduleDatabaseId: deletedSchedule.databaseId,
          },
        });
      }
    }

    for (const chargingSchedule of chargingProfile.chargingSchedule) {
      const savedChargingSchedule = await this.chargingSchedule.create(
        ChargingSchedule.build({
          chargingProfileDatabaseId: savedChargingProfile.databaseId,
          ...chargingSchedule,
        }),
      );
      if (chargingSchedule.salesTariff) {
        await this.salesTariff.create(
          SalesTariff.build({
            chargingScheduleDatabaseId: savedChargingSchedule.databaseId,
            ...chargingSchedule.salesTariff,
          }),
        );
      }
    }

    return savedChargingProfile;
  }

  async createChargingNeeds(chargingNeedsReq: NotifyEVChargingNeedsRequest): Promise<ChargingNeeds> {
    const evse = (
      await this.evse.readOrCreateByQuery({
        where: {
          id: chargingNeedsReq.evseId,
          connectorId: null,
        },
      })
    )[0];

    return await this.chargingNeeds.create(
      ChargingNeeds.build({
        ...chargingNeedsReq.chargingNeeds,
        evseId: evse.databaseId,
        maxScheduleTuples: chargingNeedsReq.maxScheduleTuples,
      }),
    );
  }

  async findChargingNeedsByEvseIdAndTransactionDBId(evseDBId: number, transactionDataBaseId: number | null): Promise<ChargingNeeds | undefined> {
    const chargingNeedsArray = await this.chargingNeeds.readAllByQuery({
      where: {
        evseId: evseDBId,
        transactionDatabaseId: transactionDataBaseId,
      },
    });

    return chargingNeedsArray.length > 0 ? chargingNeedsArray[0] : undefined;
  }
}
