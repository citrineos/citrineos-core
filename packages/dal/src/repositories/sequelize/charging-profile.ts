// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type ChargingLimitSourceEnumType,
  type ChargingNeedsDto,
  type ChargingProfileDto,
  type ChargingProfilePurposeEnumType,
  type CompositeScheduleDto,
  ChargingLimitSourceEnum,
  OCPP2_0_1,
} from '@citrineos/types';
import { Op } from 'sequelize';
import { CrudRepository } from '@citrineos/base';
import { SequelizeRepository, type SequelizeRepositoryDependencies } from './base.js';
import { stationIdFilter } from './resolve-station-id.js';
import type {
  ChargingProfileDeactivation,
  ChargingProfileQuery,
  IChargingNeedsRepository,
  IChargingProfileRepository,
  IChargingScheduleRepository,
  ICompositeScheduleRepository,
} from '../repositories.js';
import type {
  ChargingProfileInput,
  CompositeScheduleInput,
} from '../../mappers/2.0.1/charging-profile-mapper.js';
import type { CompositeScheduleInput as CompositeScheduleInput21 } from '../../mappers/2.1/charging-profile-mapper.js';
import { ChargingNeeds } from '../../models/charging-profile/charging-needs.js';
import { ChargingProfile } from '../../models/charging-profile/charging-profile.js';
import { ChargingSchedule } from '../../models/charging-profile/charging-schedule.js';
import { CompositeSchedule } from '../../models/charging-profile/composite-schedule.js';
import { SalesTariff } from '../../models/charging-profile/sales-tariff.js';
import { Evse } from '../../models/location/evse.js';
import { EvseType } from '../../models/device-model/evse-type.js';
import { Transaction } from '../../models/transaction-event/transaction.js';

const WHOLE_CHARGING_STATION_EVSE_ID = 0;

export class SequelizeChargingProfileRepository
  extends SequelizeRepository<ChargingProfile>
  implements
    IChargingProfileRepository,
    IChargingNeedsRepository,
    IChargingScheduleRepository,
    ICompositeScheduleRepository
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
  ): Promise<ChargingProfileDto> {
    let transactionDBId;
    if (chargingProfile.transactionId) {
      const activeTransaction = await Transaction.findOne({
        where: {
          stationId: await stationIdFilter(tenantId, ocppConnectionName),
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
  ): Promise<ChargingNeedsDto> {
    const activeTransaction = await Transaction.findOne({
      where: {
        tenantId,
        stationId: await stationIdFilter(tenantId, ocppConnectionName),
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
        transactionCreatedAt: activeTransaction.createdAt,
        maxScheduleTuples: chargingNeedsReq.maxScheduleTuples,
      }),
    );
  }

  async findChargingNeedsByEvseDBIdAndTransactionDBId(
    tenantId: number,
    evseDBId: number,
    transactionDataBaseId: number | null,
  ): Promise<ChargingNeedsDto | undefined> {
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
    compositeSchedule: CompositeScheduleInput | CompositeScheduleInput21,
    ocppConnectionName: string,
  ): Promise<CompositeScheduleDto> {
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
      where: {
        tenantId,
        stationId: await stationIdFilter(tenantId, ocppConnectionName),
        evseTypeId: reportedEvseId,
      },
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

  async readChargingProfiles(
    tenantId: number,
    query: ChargingProfileQuery,
  ): Promise<ChargingProfileDto[]> {
    return await this.readAllByQuery(tenantId, {
      where: { tenantId, ...definedOnly(query) },
    });
  }

  async readTxProfilesWithSchedules(
    tenantId: number,
    ocppConnectionName: string,
    transactionDatabaseId: number | null | undefined,
  ): Promise<ChargingProfileDto[]> {
    return await this.readAllByQuery(tenantId, {
      where: {
        tenantId,
        ocppConnectionName,
        transactionDatabaseId,
        chargingProfilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile,
        isActive: true,
      },
      include: [{ model: ChargingSchedule, as: 'chargingSchedule' }],
    });
  }

  async readHighestStackLevelTxProfile(
    tenantId: number,
    ocppConnectionName: string,
    transactionDatabaseId: number | null,
  ): Promise<ChargingProfileDto | undefined> {
    const [profile] = await this.readAllByQuery(tenantId, {
      where: {
        tenantId,
        ocppConnectionName,
        transactionDatabaseId,
        chargingProfilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile,
      },
      order: [['stackLevel', 'DESC']],
      limit: 1,
      include: [ChargingSchedule],
    });
    return profile;
  }

  async deactivateChargingProfiles(
    tenantId: number,
    ocppConnectionName: string,
    criteria: ChargingProfileDeactivation,
  ): Promise<number> {
    const { chargingProfileId, excludeChargingProfileId, ...rest } = criteria;
    const updated = await this.updateAllByQuery(
      tenantId,
      { isActive: false },
      {
        where: {
          tenantId,
          ocppConnectionName,
          isActive: true,
          ...definedOnly(rest),
          ...(chargingProfileId != null ? { id: chargingProfileId } : {}),
          ...(excludeChargingProfileId != null
            ? { id: { [Op.ne]: excludeChargingProfileId } }
            : {}),
        },
        returning: false,
      },
    );
    return updated.length;
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

// A criteria object only filters on the fields it actually carries; an explicit
// undefined in a sequelize `where` matches nothing rather than being ignored.
function definedOnly<T extends object>(criteria: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(criteria).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export default SequelizeChargingProfileRepository;
