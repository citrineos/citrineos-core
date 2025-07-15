// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { type BootstrapConfig } from '@citrineos/base';
import { type Dialect } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { type ILogObj, Logger } from 'tslog';
import { ComponentVariable } from './model/DeviceModel/ComponentVariable';
import {
  AdditionalInfo,
  Authorization,
  Boot,
  Certificate,
  ChangeConfiguration,
  ChargingNeeds,
  ChargingProfile,
  ChargingSchedule,
  ChargingStation,
  ChargingStationNetworkProfile,
  ChargingStationSecurityInfo,
  ChargingStationSequence,
  Component,
  CompositeSchedule,
  Connector,
  EventData,
  Evse,
  IdToken,
  IdTokenInfo,
  InstalledCertificate,
  LocalListAuthorization,
  LocalListVersion,
  LocalListVersionAuthorization,
  Location,
  MeterValue,
  OCPPMessage,
  Reservation,
  SalesTariff,
  SecurityEvent,
  SendLocalList,
  SendLocalListAuthorization,
  ServerNetworkProfile,
  Tenant,
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
import { SetNetworkProfile, StatusNotification } from './model/Location';
import { LatestStatusNotification } from './model/Location/LatestStatusNotification';
import { StartTransaction, StopTransaction } from './model/TransactionEvent';

export class DefaultSequelizeInstance {
  /**
   * Fields
   */
  private static readonly DEFAULT_RETRIES = 5;
  private static readonly DEFAULT_RETRY_DELAY = 5000;
  private static instance: Sequelize | null = null;
  private static logger: Logger<ILogObj>;
  private static config: BootstrapConfig;

  private constructor() {}

  public static getInstance(config: BootstrapConfig, logger?: Logger<ILogObj>): Sequelize {
    if (!DefaultSequelizeInstance.instance) {
      DefaultSequelizeInstance.config = config;
      DefaultSequelizeInstance.logger = logger
        ? logger.getSubLogger({ name: this.name })
        : new Logger<ILogObj>({ name: this.name });

      DefaultSequelizeInstance.instance = this.createSequelizeInstance();
    }
    return DefaultSequelizeInstance.instance;
  }

  public static async initializeSequelize(_sync: boolean = false): Promise<void> {
    let retryCount = 0;
    const maxRetries = this.config.database.maxRetries ?? this.DEFAULT_RETRIES;
    const retryDelay = this.config.database.retryDelay ?? this.DEFAULT_RETRY_DELAY;
    while (retryCount < maxRetries) {
      try {
        await this.instance!.authenticate();
        this.logger.info('Database connection has been established successfully');
        await this.syncDb();

        break;
      } catch (error) {
        retryCount++;
        this.logger.error(
          `Failed to connect to the database (attempt ${retryCount}/${maxRetries}):`,
          error,
        );
        if (retryCount < maxRetries) {
          this.logger.info(`Retrying in ${retryDelay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        } else {
          this.logger.error('Max retries reached. Unable to establish database connection.');
        }
      }
    }
  }

  private static async syncDb() {
    if (this.config.database.alter) {
      await this.instance!.sync({ alter: true });
      this.logger.info('Database altered');
    } else if (this.config.database.sync) {
      await this.instance!.sync({ force: true });
      this.logger.info('Database synchronized');
    }
  }

  private static createSequelizeInstance() {
    return new Sequelize({
      host: this.config.database.host,
      port: this.config.database.port,
      database: this.config.database.database,
      dialect: this.config.database.dialect as Dialect,
      username: this.config.database.username,
      password: this.config.database.password,
      models: [
        AdditionalInfo,
        Authorization,
        Boot,
        Certificate,
        InstalledCertificate,
        ChangeConfiguration,
        ChargingNeeds,
        ChargingProfile,
        ChargingSchedule,
        ChargingStation,
        ChargingStationNetworkProfile,
        ChargingStationSecurityInfo,
        ChargingStationSequence,
        Component,
        ComponentVariable,
        CompositeSchedule,
        Connector,
        Evse,
        EventData,
        IdToken,
        IdTokenAdditionalInfo,
        IdTokenInfo,
        Location,
        MeterValue,
        MessageInfo,
        OCPPMessage,
        Reservation,
        SalesTariff,
        SecurityEvent,
        SetNetworkProfile,
        ServerNetworkProfile,
        Transaction,
        StartTransaction,
        StatusNotification,
        StopTransaction,
        LatestStatusNotification,
        Subscription,
        TransactionEvent,
        Tariff,
        VariableAttribute,
        VariableCharacteristics,
        VariableMonitoring,
        VariableMonitoringStatus,
        VariableStatus,
        Variable,
        LocalListAuthorization,
        LocalListVersion,
        LocalListVersionAuthorization,
        SendLocalList,
        SendLocalListAuthorization,
        Tenant,
      ],
      logging: (_sql: string, _timing?: number) => {},
    });
  }
}
