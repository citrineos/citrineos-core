// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type SystemConfig } from '@citrineos/base';
import { type Dialect } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { type ILogObj, Logger } from 'tslog';
import { ComponentVariable } from './model/DeviceModel/ComponentVariable';
import {
  AdditionalInfo,
  Authorization,
  Boot,
  Certificate,
  ChargingNeeds,
  ChargingProfile,
  ChargingSchedule,
  ChargingStation,
  Component,
  CompositeSchedule,
  EventData,
  Evse,
  IdToken,
  IdTokenInfo,
  Location,
  MeterValue,
  SalesTariff,
  SecurityEvent,
  Transaction,
  TransactionEvent,
  Variable,
  VariableAttribute,
  VariableCharacteristics,
  VariableMonitoring,
  VariableMonitoringStatus,
} from '.';
import { VariableStatus } from './model/DeviceModel';
import { MessageInfo } from './model/MessageInfo';
import { Subscription } from './model/Subscription';
import { Tariff } from './model/Tariff';
import { IdTokenAdditionalInfo } from './model/Authorization/IdTokenAdditionalInfo';
import { StatusNotification } from './model/Location';
import { dropAllViews } from './sql';

export class DefaultSequelizeInstance {
  /**
   * Fields
   */
  private static instance: Sequelize | null = null;

  private constructor() {}

  public static getInstance(config: SystemConfig, logger?: Logger<ILogObj>, sync: boolean = false): Sequelize {
    if (!DefaultSequelizeInstance.instance) {
      DefaultSequelizeInstance.instance = this.defaultSequelize(config, sync, logger);
    }
    return DefaultSequelizeInstance.instance;
  }

  private static defaultSequelize(config: SystemConfig, sync?: boolean, logger?: Logger<ILogObj>) {
    const sequelizeLogger = logger ? logger.getSubLogger({ name: this.name }) : new Logger<ILogObj>({ name: this.name });

    sequelizeLogger.info('Creating default Sequelize instance');

    const sequelize: Sequelize = new Sequelize({
      host: config.data.sequelize.host,
      port: config.data.sequelize.port,
      database: config.data.sequelize.database,
      dialect: config.data.sequelize.dialect as Dialect,
      username: config.data.sequelize.username,
      password: config.data.sequelize.password,
      storage: config.data.sequelize.storage,
      models: [
        AdditionalInfo,
        Authorization,
        Boot,
        Certificate,
        ChargingNeeds,
        ChargingProfile,
        ChargingSchedule,
        ChargingStation,
        Component,
        ComponentVariable,
        CompositeSchedule,
        Evse,
        EventData,
        IdToken,
        IdTokenAdditionalInfo,
        IdTokenInfo,
        Location,
        MeterValue,
        MessageInfo,
        SalesTariff,
        SecurityEvent,
        StatusNotification,
        Subscription,
        Transaction,
        TransactionEvent,
        Tariff,
        VariableAttribute,
        VariableCharacteristics,
        VariableMonitoring,
        VariableMonitoringStatus,
        VariableStatus,
        Variable,
      ],
      logging: (_sql: string, _timing?: number) => {
        // TODO: Look into fixing that
        // sequelizeLogger.debug(timing, sql);
      },
    });

    handleSequelizeSync(sequelize, config, sequelizeLogger).then();

    return sequelize;
  }
}

const dropViews = async (sequelize: Sequelize): Promise<void> => {
  await sequelize.query(dropAllViews);
}

export const handleSequelizeSync = async (
  sequelize: Sequelize,
  config: SystemConfig,
  logger: Logger<ILogObj>
): Promise<void> => {

  let syncOpts = undefined;
  if (config.data.sequelize.alter) {
    syncOpts = { alter: true };
  } else if (config.data.sequelize.sync) {
    syncOpts = { force: true };
  }
  if (syncOpts) {
    // drop views to prevent conflicts
    await dropViews(sequelize);
    await sequelize.sync(syncOpts).then(() => {
      logger.info('Database altered');
    });
  }

}
