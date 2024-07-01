// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ChargingLimitSourceEnumType, ChargingProfileType, CompositeScheduleType, CrudRepository, NotifyEVChargingNeedsRequest, SystemConfig } from '@citrineos/base';
import { SequelizeRepository } from './Base';
import { IChargingProfileRepository } from '../../../interfaces';
import { Evse } from '../model/DeviceModel';
import { Sequelize } from 'sequelize-typescript';
import { Logger, ILogObj } from 'tslog';
import { ChargingNeeds, ChargingProfile, ChargingSchedule, CompositeSchedule, SalesTariff } from '../model/ChargingProfile';
import { Transaction } from '../model/TransactionEvent';

export class SequelizeChargingProfileRepository extends SequelizeRepository<ChargingProfile> implements IChargingProfileRepository {
  chargingNeeds: CrudRepository<ChargingNeeds>;
  chargingSchedule: CrudRepository<ChargingSchedule>;
  salesTariff: CrudRepository<SalesTariff>;
  transaction: CrudRepository<Transaction>;
  evse: CrudRepository<Evse>;
  compositeSchedule: CrudRepository<CompositeSchedule>;

  constructor(
    config: SystemConfig,
    logger?: Logger<ILogObj>,
    sequelizeInstance?: Sequelize,
    chargingNeeds?: CrudRepository<ChargingNeeds>,
    chargingSchedule?: CrudRepository<ChargingSchedule>,
    salesTariff?: CrudRepository<SalesTariff>,
    transaction?: CrudRepository<Transaction>,
    evse?: CrudRepository<Evse>,
    compositeSchedule?: CrudRepository<CompositeSchedule>,
  ) {
    super(config, ChargingProfile.MODEL_NAME, logger, sequelizeInstance);
    this.chargingNeeds = chargingNeeds ? chargingNeeds : new SequelizeRepository<ChargingNeeds>(config, ChargingNeeds.MODEL_NAME, logger, sequelizeInstance);
    this.chargingSchedule = chargingSchedule ? chargingSchedule : new SequelizeRepository<ChargingSchedule>(config, ChargingSchedule.MODEL_NAME, logger, sequelizeInstance);
    this.evse = evse ? evse : new SequelizeRepository<Evse>(config, Evse.MODEL_NAME, logger, sequelizeInstance);
    this.salesTariff = salesTariff ? salesTariff : new SequelizeRepository<SalesTariff>(config, SalesTariff.MODEL_NAME, logger, sequelizeInstance);
    this.transaction = transaction ? transaction : new SequelizeRepository<Transaction>(config, Transaction.MODEL_NAME, logger, sequelizeInstance);
    this.compositeSchedule = compositeSchedule ? compositeSchedule : new SequelizeRepository<CompositeSchedule>(config, CompositeSchedule.MODEL_NAME, logger, sequelizeInstance);
  }

  async createOrUpdateChargingProfile(chargingProfile: ChargingProfileType, stationId: string, evseId?: number, chargingLimitSource?: ChargingLimitSourceEnumType, isActive?: boolean): Promise<ChargingProfile> {
    let transactionDBId;
    if (chargingProfile.transactionId) {
      const activeTransaction = await Transaction.findOne({
        where: {
          stationId,
          transactionId: chargingProfile.transactionId,
        },
      });
      transactionDBId = activeTransaction?.id;
    }

    const [savedChargingProfile, profileCreated] = await this.readOrCreateByQuery({
      where: {
        stationId: stationId,
        id: chargingProfile.id,
      },
      defaults: {
        ...chargingProfile,
        evseId: evseId,
        transactionDatabaseId: transactionDBId,
        chargingLimitSource: chargingLimitSource ?? ChargingLimitSourceEnumType.CSO,
        isActive: isActive === undefined ? false : isActive,
      },
    });
    if (!profileCreated) {
      await this.updateByKey(
        {
          ...chargingProfile,
          stationId: stationId,
          transactionDatabaseId: transactionDBId,
          evseId: evseId,
          chargingLimitSource: chargingLimitSource ?? ChargingLimitSourceEnumType.CSO,
          isActive: isActive === undefined ? false : isActive,
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
          stationId: stationId,
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

  async createChargingNeeds(chargingNeedsReq: NotifyEVChargingNeedsRequest, stationId: string): Promise<ChargingNeeds> {
    const evse = (
      await this.evse.readOrCreateByQuery({
        where: {
          id: chargingNeedsReq.evseId,
          connectorId: null,
        },
      })
    )[0];

    const activeTransaction = await Transaction.findOne({
      where: {
        isActive: true,
        stationId,
        evseDatabaseId: evse.databaseId,
      },
    });
    if (!activeTransaction) {
      throw new Error(`No active transaction found on station ${stationId} evse ${evse.databaseId}`);
    }

    return await this.chargingNeeds.create(
      ChargingNeeds.build({
        ...chargingNeedsReq.chargingNeeds,
        evseDatabaseId: evse.databaseId,
        transactionDatabaseId: activeTransaction.id,
        maxScheduleTuples: chargingNeedsReq.maxScheduleTuples,
      }),
    );
  }

  async findChargingNeedsByEvseDBIdAndTransactionDBId(evseDBId: number, transactionDataBaseId: number | null): Promise<ChargingNeeds | undefined> {
    const chargingNeedsArray = await this.chargingNeeds.readAllByQuery({
      where: {
        evseDatabaseId: evseDBId,
        transactionDatabaseId: transactionDataBaseId,
      },
    });

    return chargingNeedsArray.length > 0 ? chargingNeedsArray[0] : undefined;
  }

  async createCompositeSchedule(compositeSchedule: CompositeScheduleType, stationId: string): Promise<CompositeSchedule> {
    return await this.compositeSchedule.create(
      CompositeSchedule.build({
        ...compositeSchedule,
        stationId,
      }),
    );
  }

  async getNextChargingScheduleId(stationId: string): Promise<number> {
    return await this.chargingSchedule.readNextId('id', { where: { stationId } });
  }

  async getNextChargingProfileId(stationId: string): Promise<number> {
    return await this.readNextId('id', { where: { stationId } });
  }
}
