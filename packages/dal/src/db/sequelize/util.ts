// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type SystemConfig } from '@citrineos/types';
import { type Dialect } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { type ILogObj, Logger } from 'tslog';
import { AsyncJobStatus } from '../../models/AsyncJob/AsyncJobStatus.js';
import { Authorization } from '../../models/Authorization/Authorization.js';
import { LocalListAuthorization } from '../../models/Authorization/LocalListAuthorization.js';
import { LocalListVersion } from '../../models/Authorization/LocalListVersion.js';
import { LocalListVersionAuthorization } from '../../models/Authorization/LocalListVersionAuthorization.js';
import { SendLocalList } from '../../models/Authorization/SendLocalList.js';
import { SendLocalListAuthorization } from '../../models/Authorization/SendLocalListAuthorization.js';
import { Boot } from '../../models/Boot.js';
import { Certificate } from '../../models/Certificate/Certificate.js';
import { DeleteCertificateAttempt } from '../../models/Certificate/DeleteCertificateAttempt.js';
import { InstallCertificateAttempt } from '../../models/Certificate/InstallCertificateAttempt.js';
import { InstalledCertificate } from '../../models/Certificate/InstalledCertificate.js';
import { ChangeConfiguration } from '../../models/ChangeConfiguration.js';
import { ChargingNeeds } from '../../models/ChargingProfile/ChargingNeeds.js';
import { ChargingProfile } from '../../models/ChargingProfile/ChargingProfile.js';
import { ChargingSchedule } from '../../models/ChargingProfile/ChargingSchedule.js';
import { CompositeSchedule } from '../../models/ChargingProfile/CompositeSchedule.js';
import { SalesTariff } from '../../models/ChargingProfile/SalesTariff.js';
import { ChargingStationSecurityInfo } from '../../models/ChargingStationSecurityInfo.js';
import { ChargingStationSequence } from '../../models/ChargingStationSequence/ChargingStationSequence.js';
import { Component } from '../../models/DeviceModel/Component.js';
import { ComponentVariable } from '../../models/DeviceModel/ComponentVariable.js';
import { EvseType } from '../../models/DeviceModel/EvseType.js';
import { Variable } from '../../models/DeviceModel/Variable.js';
import { VariableAttribute } from '../../models/DeviceModel/VariableAttribute.js';
import { VariableCharacteristics } from '../../models/DeviceModel/VariableCharacteristics.js';
import { VariableStatus } from '../../models/DeviceModel/VariableStatus.js';
import { ChargingStation } from '../../models/Location/ChargingStation.js';
import { ChargingStationNetworkProfile } from '../../models/Location/ChargingStationNetworkProfile.js';
import { Connector } from '../../models/Location/Connector.js';
import { Evse } from '../../models/Location/Evse.js';
import { LatestStatusNotification } from '../../models/Location/LatestStatusNotification.js';
import { Location } from '../../models/Location/Location.js';
import { ServerNetworkProfile } from '../../models/Location/ServerNetworkProfile.js';
import { SetNetworkProfile } from '../../models/Location/SetNetworkProfile.js';
import { StatusNotification } from '../../models/Location/StatusNotification.js';
import { MessageInfo } from '../../models/MessageInfo/MessageInfo.js';
import { OCPPMessage } from '../../models/OCPPMessage.js';
import { Reservation } from '../../models/Reservation.js';
import { SecurityEvent } from '../../models/SecurityEvent.js';
import { Subscription } from '../../models/Subscription/Subscription.js';
import { Tariff } from '../../models/Tariff/Tariffs.js';
import { Tenant } from '../../models/Tenant.js';
import { TenantPartner } from '../../models/TenantPartner.js';
import { MeterValue } from '../../models/TransactionEvent/MeterValue.js';
import { StartTransaction } from '../../models/TransactionEvent/StartTransaction.js';
import { StopTransaction } from '../../models/TransactionEvent/StopTransaction.js';
import { Transaction } from '../../models/TransactionEvent/Transaction.js';
import { TransactionEvent } from '../../models/TransactionEvent/TransactionEvent.js';
import { EventData } from '../../models/VariableMonitoring/EventData.js';
import { VariableMonitoring } from '../../models/VariableMonitoring/VariableMonitoring.js';
import { VariableMonitoringStatus } from '../../models/VariableMonitoring/VariableMonitoringStatus.js';

export class DefaultSequelizeInstance {
  /**
   * Fields
   */
  private static readonly DEFAULT_RETRIES = 5;
  private static readonly DEFAULT_RETRY_DELAY = 5000;
  private static instance: Sequelize | null = null;
  private static logger: Logger<ILogObj>;
  private static config: SystemConfig;

  private constructor() {}

  public static getInstance(config: SystemConfig, logger?: Logger<ILogObj>): Sequelize {
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
    this.logger.info(`Sequelize initialized: ${JSON.stringify(this.instance?.config || {})}`);
  }

  private static async syncDb(): Promise<void> {
    if (this.config.database.sync) {
      const alter = this.config.database.alter;
      const force = this.config.database.force;
      if (force) {
        this.logger.info('Database force synchronizing');
        await this.instance!.sync({ force: true });
        this.logger.info('Database force synchronized');
      } else if (alter) {
        this.logger.info('Database altering');
        await this.instance!.sync({ alter: true });
        this.logger.info('Database altered');
      } else {
        this.logger.info('Database synchronizing');
        await this.instance!.sync();
        this.logger.info('Database synchronized');
      }
    }
  }

  private static createSequelizeInstance() {
    const sequelize = new Sequelize({
      host: this.config.database.host,
      port: this.config.database.port,
      database: this.config.database.database,
      dialect: this.config.database.dialect as Dialect,
      username: this.config.database.username,
      password: this.config.database.password,
      models: [
        AsyncJobStatus,
        Authorization,
        Boot,
        Certificate,
        InstalledCertificate,
        InstallCertificateAttempt,
        DeleteCertificateAttempt,
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
        EvseType,
        EventData,
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
        TenantPartner,
      ],
      pool: this.config.database.pool,
      ...(this.config.database.ssl && {
        dialectOptions: {
          ssl: this.config.database.ssl,
        },
      }),
      logging: (_sql: string, _timing?: number) => {},
    });

    return sequelize;
  }
}
