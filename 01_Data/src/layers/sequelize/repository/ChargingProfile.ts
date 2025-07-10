// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { CrudRepository, OCPP2_0_1, BootstrapConfig } from '@citrineos/base';
import { SequelizeRepository } from './Base';
import { IChargingProfileRepository } from '../../../interfaces';
import { Evse } from '../model/DeviceModel';
import { Sequelize } from 'sequelize-typescript';
import { Logger, ILogObj } from 'tslog';
import {
  ChargingNeeds,
  ChargingProfile,
  ChargingSchedule,
  CompositeSchedule,
  SalesTariff,
} from '../model/ChargingProfile';
import { Transaction } from '../model/TransactionEvent';

export class SequelizeChargingProfileRepository
  extends SequelizeRepository<ChargingProfile>
  implements IChargingProfileRepository
{
  chargingNeeds: CrudRepository<ChargingNeeds>;
  chargingSchedule: CrudRepository<ChargingSchedule>;
  salesTariff: CrudRepository<SalesTariff>;
  transaction: CrudRepository<Transaction>;
  evse: CrudRepository<Evse>;
  compositeSchedule: CrudRepository<CompositeSchedule>;

  constructor(
    config: BootstrapConfig,
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
    this.chargingNeeds = chargingNeeds
      ? chargingNeeds
      : new SequelizeRepository<ChargingNeeds>(
          config,
          ChargingNeeds.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.chargingSchedule = chargingSchedule
      ? chargingSchedule
      : new SequelizeRepository<ChargingSchedule>(
          config,
          ChargingSchedule.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.evse = evse
      ? evse
      : new SequelizeRepository<Evse>(config, Evse.MODEL_NAME, logger, sequelizeInstance);
    this.salesTariff = salesTariff
      ? salesTariff
      : new SequelizeRepository<SalesTariff>(
          config,
          SalesTariff.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.transaction = transaction
      ? transaction
      : new SequelizeRepository<Transaction>(
          config,
          Transaction.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
    this.compositeSchedule = compositeSchedule
      ? compositeSchedule
      : new SequelizeRepository<CompositeSchedule>(
          config,
          CompositeSchedule.MODEL_NAME,
          logger,
          sequelizeInstance,
        );
  }

  async createOrUpdateChargingProfile(
    tenantId: number,
    chargingProfile: OCPP2_0_1.ChargingProfileType,
    stationId: string,
    evseId?: number | null,
    chargingLimitSource?: OCPP2_0_1.ChargingLimitSourceEnumType,
    isActive?: boolean,
  ): Promise<ChargingProfile> {
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

    const [savedChargingProfile, profileCreated] = await this.readOrCreateByQuery(tenantId, {
      where: {
        tenantId: tenantId,
        stationId: stationId,
        id: chargingProfile.id,
      },
      defaults: {
        ...chargingProfile,
        evseId: evseId,
        transactionDatabaseId: transactionDBId,
        chargingLimitSource: chargingLimitSource ?? OCPP2_0_1.ChargingLimitSourceEnumType.CSO,
        isActive: isActive === undefined ? false : isActive,
      },
    });
    if (!profileCreated) {
      await this.updateByKey(
        tenantId,
        {
          ...chargingProfile,
          chargingSchedule: chargingProfile.chargingSchedule.map((s) => ({ ...s })) as
            | [ChargingSchedule]
            | [ChargingSchedule, ChargingSchedule]
            | [ChargingSchedule, ChargingSchedule, ChargingSchedule],
          stationId: stationId,
          transactionDatabaseId: transactionDBId,
          evseId: evseId,
          chargingLimitSource: chargingLimitSource ?? OCPP2_0_1.ChargingLimitSourceEnumType.CSO,
          isActive: isActive === undefined ? false : isActive,
        },
        savedChargingProfile.databaseId.toString(),
      );
      // delete existed charging schedules and sales tariff
      const deletedChargingSchedules = await this.chargingSchedule.deleteAllByQuery(tenantId, {
        where: {
          chargingProfileDatabaseId: savedChargingProfile.databaseId,
        },
      });
      for (const deletedSchedule of deletedChargingSchedules) {
        await this.salesTariff.deleteAllByQuery(tenantId, {
          where: {
            chargingScheduleDatabaseId: deletedSchedule.databaseId,
          },
        });
      }
    }

    for (const chargingSchedule of chargingProfile.chargingSchedule) {
      const savedChargingSchedule = await this.chargingSchedule.create(
        tenantId,
        ChargingSchedule.build({
          tenantId,
          stationId,
          chargingProfileDatabaseId: savedChargingProfile.databaseId,
          ...chargingSchedule,
        }),
      );
      if (chargingSchedule.salesTariff) {
        await this.salesTariff.create(
          tenantId,
          SalesTariff.build({
            tenantId,
            chargingScheduleDatabaseId: savedChargingSchedule.databaseId,
            ...chargingSchedule.salesTariff,
          }),
        );
      }
    }

    return savedChargingProfile;
  }

  async createChargingNeeds(
    tenantId: number,
    chargingNeedsReq: OCPP2_0_1.NotifyEVChargingNeedsRequest,
    stationId: string,
  ): Promise<ChargingNeeds> {
    const activeTransaction = await Transaction.findOne({
      where: {
        stationId,
        isActive: true,
      },
      include: [{ model: Evse, where: { id: chargingNeedsReq.evseId }, required: true }],
    });
    if (!activeTransaction) {
      throw new Error(
        `No active transaction found on station ${stationId} evse ${chargingNeedsReq.evseId}`,
      );
    }

    return await this.chargingNeeds.create(
      tenantId,
      ChargingNeeds.build({
        tenantId,
        ...chargingNeedsReq.chargingNeeds,
        evseDatabaseId: activeTransaction.evseDatabaseId,
        transactionDatabaseId: activeTransaction.id,
        maxScheduleTuples: chargingNeedsReq.maxScheduleTuples,
      }),
    );
  }

  async findChargingNeedsByEvseDBIdAndTransactionDBId(
    tenantId: number,
    evseDBId: number,
    transactionDataBaseId: number | null,
  ): Promise<ChargingNeeds | undefined> {
    const chargingNeedsArray = await this.chargingNeeds.readAllByQuery(tenantId, {
      where: {
        evseDatabaseId: evseDBId,
        transactionDatabaseId: transactionDataBaseId,
      },
      order: [['createdAt', 'DESC']],
    });

    return chargingNeedsArray.length > 0 ? chargingNeedsArray[0] : undefined;
  }

  async createCompositeSchedule(
    tenantId: number,
    compositeSchedule: OCPP2_0_1.CompositeScheduleType,
    stationId: string,
  ): Promise<CompositeSchedule> {
    return await this.compositeSchedule.create(
      tenantId,
      CompositeSchedule.build({
        tenantId,
        ...compositeSchedule,
        stationId,
      }),
    );
  }

  async getNextChargingScheduleId(tenantId: number, stationId: string): Promise<number> {
    return await this.chargingSchedule.readNextValue(tenantId, 'id', { where: { stationId } });
  }

  async getNextChargingProfileId(tenantId: number, stationId: string): Promise<number> {
    return await this.readNextValue(tenantId, 'id', { where: { stationId } });
  }

  async getNextStackLevel(
    tenantId: number,
    stationId: string,
    transactionDatabaseId: number | null,
    profilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType,
  ): Promise<number> {
    return await this.readNextValue(
      tenantId,
      'stackLevel',
      {
        where: {
          stationId,
          transactionDatabaseId: transactionDatabaseId,
          chargingProfilePurpose: profilePurpose,
        },
      },
      0,
    );
  }
}
