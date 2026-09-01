// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type ChargingLimitSourceEnumType,
  type ChargingProfilePurposeEnumType,
  ChargingLimitSourceEnum,
  OCPP2_0_1,
} from '@citrineos/types';
import { CrudRepository } from '@citrineos/base';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './Base.js';
import type { IChargingProfileRepository } from '../repositories.js';
import type {
  ChargingProfileInput,
  CompositeScheduleInput,
} from '../../mappers/2.0.1/ChargingProfileMapper.js';
import { ChargingNeeds } from '../../models/ChargingProfile/ChargingNeeds.js';
import { ChargingProfile } from '../../models/ChargingProfile/ChargingProfile.js';
import { ChargingSchedule } from '../../models/ChargingProfile/ChargingSchedule.js';
import { CompositeSchedule } from '../../models/ChargingProfile/CompositeSchedule.js';
import { SalesTariff } from '../../models/ChargingProfile/SalesTariff.js';
import { Evse } from '../../models/Location/Evse.js';
import { EvseType } from '../../models/DeviceModel/EvseType.js';
import { Transaction } from '../../models/TransactionEvent/Transaction.js';

const WHOLE_CHARGING_STATION_EVSE_ID = 0;

export class SequelizeChargingProfileRepository
  extends SequelizeRepository<ChargingProfile>
  implements IChargingProfileRepository
{
  chargingNeeds: CrudRepository<ChargingNeeds>;
  chargingSchedule: CrudRepository<ChargingSchedule>;
  salesTariff: CrudRepository<SalesTariff>;
  transaction: CrudRepository<Transaction>;
  evse: CrudRepository<EvseType>;
  stationEvse: CrudRepository<Evse>;
  compositeSchedule: CrudRepository<CompositeSchedule>;

  constructor({ config, logger, sequelizeInstance }: SequelizeRepositoryDependencies) {
    super({ config, namespace: ChargingProfile.MODEL_NAME, logger, sequelizeInstance });
    this.chargingNeeds = new SequelizeRepository<ChargingNeeds>({
      config,
      namespace: ChargingNeeds.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.chargingSchedule = new SequelizeRepository<ChargingSchedule>({
      config,
      namespace: ChargingSchedule.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.evse = new SequelizeRepository<EvseType>({
      config,
      namespace: EvseType.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.stationEvse = new SequelizeRepository<Evse>({
      config,
      namespace: Evse.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.salesTariff = new SequelizeRepository<SalesTariff>({
      config,
      namespace: SalesTariff.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.transaction = new SequelizeRepository<Transaction>({
      config,
      namespace: Transaction.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
    this.compositeSchedule = new SequelizeRepository<CompositeSchedule>({
      config,
      namespace: CompositeSchedule.MODEL_NAME,
      logger,
      sequelizeInstance,
    });
  }

  async createOrUpdateChargingProfile(
    tenantId: number,
    chargingProfile: ChargingProfileInput,
    ocppConnectionName: string,
    evseId?: number | null,
    chargingLimitSource?: ChargingLimitSourceEnumType,
    isActive?: boolean,
  ): Promise<ChargingProfile> {
    let transactionDBId;
    if (chargingProfile.transactionId) {
      const activeTransaction = await Transaction.findOne({
        where: {
          ocppConnectionName: ocppConnectionName,
          transactionId: chargingProfile.transactionId,
        },
      });
      transactionDBId = activeTransaction?.id;
    }

    const [savedChargingProfile, profileCreated] = await this.readOrCreateByQuery(tenantId, {
      where: {
        tenantId: tenantId,
        ocppConnectionName: ocppConnectionName,
        id: chargingProfile.id,
      },
      defaults: {
        ...chargingProfile,
        ocppConnectionName: ocppConnectionName,
        evseId: evseId,
        transactionDatabaseId: transactionDBId,
        chargingLimitSource: chargingLimitSource ?? ChargingLimitSourceEnum.CSO,
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
          ocppConnectionName: ocppConnectionName,
          transactionDatabaseId: transactionDBId,
          evseId: evseId,
          chargingLimitSource: chargingLimitSource ?? ChargingLimitSourceEnum.CSO,
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
          ocppConnectionName: ocppConnectionName,
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
    ocppConnectionName: string,
  ): Promise<ChargingNeeds> {
    const activeTransaction = await Transaction.findOne({
      where: {
        ocppConnectionName: ocppConnectionName,
        isActive: true,
      },
      include: [{ model: Evse, where: { evseTypeId: chargingNeedsReq.evseId }, required: true }],
    });
    if (!activeTransaction) {
      throw new Error(
        `No active transaction found on station ${ocppConnectionName} evse ${chargingNeedsReq.evseId}`,
      );
    }

    return await this.chargingNeeds.create(
      tenantId,
      ChargingNeeds.build({
        tenantId,
        ...chargingNeedsReq.chargingNeeds,
        evseId: activeTransaction.evseId,
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
        evseId: evseDBId,
        transactionDatabaseId: transactionDataBaseId,
      },
      order: [['createdAt', 'DESC']],
    });

    return chargingNeedsArray.length > 0 ? chargingNeedsArray[0] : undefined;
  }

  async createCompositeSchedule(
    tenantId: number,
    compositeSchedule: CompositeScheduleInput,
    ocppConnectionName: string,
  ): Promise<CompositeSchedule> {
    const evseId = await this.resolveCompositeScheduleEvse(
      tenantId,
      ocppConnectionName,
      compositeSchedule.evseId,
    );

    return await this.compositeSchedule.create(
      tenantId,
      CompositeSchedule.build({
        tenantId,
        ...compositeSchedule,
        evseId,
        ocppConnectionName: ocppConnectionName,
      }),
    );
  }

  private async resolveCompositeScheduleEvse(
    tenantId: number,
    ocppConnectionName: string,
    reportedEvseId: number | null | undefined,
  ): Promise<number | null> {
    if (reportedEvseId == null || reportedEvseId === WHOLE_CHARGING_STATION_EVSE_ID) {
      return null;
    }

    const [evse] = await this.stationEvse.readAllByQuery(tenantId, {
      where: { tenantId, ocppConnectionName, evseTypeId: reportedEvseId },
      limit: 1,
    });

    if (!evse) {
      this.logger.warn(
        `Composite schedule for ${ocppConnectionName} names EVSE ${reportedEvseId}, which is not ` +
          `recorded on that station. Storing the schedule without an EVSE association.`,
      );
      return null;
    }

    return evse.id;
  }

  async getNextChargingScheduleId(tenantId: number, ocppConnectionName: string): Promise<number> {
    return await this.chargingSchedule.readNextValue(tenantId, 'id', {
      where: { ocppConnectionName: ocppConnectionName },
    });
  }

  async getNextChargingProfileId(tenantId: number, ocppConnectionName: string): Promise<number> {
    return await this.readNextValue(tenantId, 'id', {
      where: { ocppConnectionName: ocppConnectionName },
    });
  }

  async getNextStackLevel(
    tenantId: number,
    ocppConnectionName: string,
    transactionDatabaseId: number | null,
    profilePurpose: ChargingProfilePurposeEnumType,
  ): Promise<number> {
    return await this.readNextValue(
      tenantId,
      'stackLevel',
      {
        where: {
          ocppConnectionName: ocppConnectionName,
          transactionDatabaseId: transactionDatabaseId,
          chargingProfilePurpose: profilePurpose,
        },
      },
      0,
    );
  }
}

export default SequelizeChargingProfileRepository;
