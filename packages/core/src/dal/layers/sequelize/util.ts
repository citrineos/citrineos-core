// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type BootstrapConfig } from '@citrineos/base';
import { type Dialect } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { type ILogObj, Logger } from 'tslog';
import { ComponentVariable } from './model/DeviceModel/ComponentVariable.js';
import { Authorization } from './model/Authorization/Authorization.js';
import { Boot } from './model/Boot.js';
import { AsyncJobStatus } from './model/AsyncJob/AsyncJobStatus.js';
import { Certificate } from './model/Certificate/Certificate.js';
import { ChangeConfiguration } from './model/ChangeConfiguration.js';
import { ChargingNeeds } from './model/ChargingProfile/ChargingNeeds.js';
import { ChargingProfile } from './model/ChargingProfile/ChargingProfile.js';
import { ChargingSchedule } from './model/ChargingProfile/ChargingSchedule.js';
import { ChargingStation } from './model/Location/ChargingStation.js';
import { ChargingStationNetworkProfile } from './model/Location/ChargingStationNetworkProfile.js';
import { ChargingStationSecurityInfo } from './model/ChargingStationSecurityInfo.js';
import { ChargingStationSequence } from './model/ChargingStationSequence/ChargingStationSequence.js';
import { Component } from './model/DeviceModel/Component.js';
import { CompositeSchedule } from './model/ChargingProfile/CompositeSchedule.js';
import { Connector } from './model/Location/Connector.js';
import { DeleteCertificateAttempt } from './model/Certificate/DeleteCertificateAttempt.js';
import { EventData } from './model/VariableMonitoring/EventData.js';
import { Evse } from './model/Location/Evse.js';
import { EvseType } from './model/DeviceModel/EvseType.js';
import { InstallCertificateAttempt } from './model/Certificate/InstallCertificateAttempt.js';
import { InstalledCertificate } from './model/Certificate/InstalledCertificate.js';
import { LatestStatusNotification } from './model/Location/LatestStatusNotification.js';
import { LocalListAuthorization } from './model/Authorization/LocalListAuthorization.js';
import { LocalListVersion } from './model/Authorization/LocalListVersion.js';
import { LocalListVersionAuthorization } from './model/Authorization/LocalListVersionAuthorization.js';
import { Location } from './model/Location/Location.js';
import { MessageInfo } from './model/MessageInfo/MessageInfo.js';
import { MeterValue } from './model/TransactionEvent/MeterValue.js';
import { OCPPMessage } from './model/OCPPMessage.js';
import { Reservation } from './model/Reservation.js';
import { SalesTariff } from './model/ChargingProfile/SalesTariff.js';
import { SecurityEvent } from './model/SecurityEvent.js';
import { SendLocalList } from './model/Authorization/SendLocalList.js';
import { SendLocalListAuthorization } from './model/Authorization/SendLocalListAuthorization.js';
import { ServerNetworkProfile } from './model/Location/ServerNetworkProfile.js';
import { SetNetworkProfile } from './model/Location/SetNetworkProfile.js';
import { StartTransaction } from './model/TransactionEvent/StartTransaction.js';
import { StatusNotification } from './model/Location/StatusNotification.js';
import { StopTransaction } from './model/TransactionEvent/StopTransaction.js';
import { Subscription } from './model/Subscription/Subscription.js';
import { Tariff } from './model/Tariff/Tariffs.js';
import { Tenant } from './model/Tenant.js';
import { TenantPartner } from './model/TenantPartner.js';
import { Transaction } from './model/TransactionEvent/Transaction.js';
import { TransactionEvent } from './model/TransactionEvent/TransactionEvent.js';
import { Variable } from './model/DeviceModel/Variable.js';
import { VariableAttribute } from './model/DeviceModel/VariableAttribute.js';
import { VariableCharacteristics } from './model/DeviceModel/VariableCharacteristics.js';
import { VariableMonitoring } from './model/VariableMonitoring/VariableMonitoring.js';
import { VariableMonitoringStatus } from './model/VariableMonitoring/VariableMonitoringStatus.js';
import { VariableStatus } from './model/DeviceModel/VariableStatus.js';

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

  /**
   * Attempts to establish a database connection, retrying up to `database.maxRetries`. If retries
   * are exhausted, throws an error to prevent running the process with no usable database connection.
   */
  public static async initializeSequelize(_sync: boolean = false): Promise<void> {
    const maxRetries = this.config.database.maxRetries ?? this.DEFAULT_RETRIES;
    const retryDelay = this.config.database.retryDelay ?? this.DEFAULT_RETRY_DELAY;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.instance!.authenticate();
        this.logger.info('Database connection has been established successfully');

        await this.syncDb();

        this.logger.info(`Sequelize initialized: ${JSON.stringify(this.instance?.config || {})}`);
        return;
      } catch (error) {
        lastError = error;
        this.logger.error(
          `Failed to connect to the database (attempt ${attempt}/${maxRetries}):`,
          error,
        );
        if (attempt < maxRetries) {
          this.logger.info(`Retrying in ${retryDelay / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    }

    this.logger.error('Max retries reached. Unable to establish database connection.');
    throw new Error(
      `Unable to initialize the database connection after ${maxRetries} attempt(s): ` +
        `${lastError instanceof Error ? lastError.message : String(lastError)}`,
      { cause: lastError },
    );
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
