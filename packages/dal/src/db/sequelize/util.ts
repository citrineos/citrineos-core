// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type SystemConfig } from '@citrineos/types';
import { type Dialect } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { type ILogObj, Logger } from 'tslog';
import { AsyncJobStatus } from '../../models/async-job/async-job-status.js';
import { Authorization } from '../../models/authorization/authorization.js';
import { LocalListAuthorization } from '../../models/authorization/local-list-authorization.js';
import { LocalListVersion } from '../../models/authorization/local-list-version.js';
import { LocalListVersionAuthorization } from '../../models/authorization/local-list-version-authorization.js';
import { SendLocalList } from '../../models/authorization/send-local-list.js';
import { SendLocalListAuthorization } from '../../models/authorization/send-local-list-authorization.js';
import { Boot } from '../../models/boot.js';
import { Certificate } from '../../models/certificate/certificate.js';
import { DeleteCertificateAttempt } from '../../models/certificate/delete-certificate-attempt.js';
import { InstallCertificateAttempt } from '../../models/certificate/install-certificate-attempt.js';
import { InstalledCertificate } from '../../models/certificate/installed-certificate.js';
import { ChangeConfiguration } from '../../models/change-configuration.js';
import { ChargingNeeds } from '../../models/charging-profile/charging-needs.js';
import { ChargingProfile } from '../../models/charging-profile/charging-profile.js';
import { ChargingSchedule } from '../../models/charging-profile/charging-schedule.js';
import { CompositeSchedule } from '../../models/charging-profile/composite-schedule.js';
import { SalesTariff } from '../../models/charging-profile/sales-tariff.js';
import { ChargingStationSecurityInfo } from '../../models/charging-station-security-info.js';
import { ChargingStationSequence } from '../../models/charging-station-sequence/charging-station-sequence.js';
import { Component } from '../../models/device-model/component.js';
import { ComponentVariable } from '../../models/device-model/component-variable.js';
import { EvseType } from '../../models/device-model/evse-type.js';
import { Variable } from '../../models/device-model/variable.js';
import { VariableAttribute } from '../../models/device-model/variable-attribute.js';
import { VariableCharacteristics } from '../../models/device-model/variable-characteristics.js';
import { VariableStatus } from '../../models/device-model/variable-status.js';
import { ChargingStation } from '../../models/location/charging-station.js';
import { ChargingStationNetworkProfile } from '../../models/location/charging-station-network-profile.js';
import { Connector } from '../../models/location/connector.js';
import { Evse } from '../../models/location/evse.js';
import { LatestStatusNotification } from '../../models/location/latest-status-notification.js';
import { Location } from '../../models/location/location.js';
import { ServerNetworkProfile } from '../../models/location/server-network-profile.js';
import { SetNetworkProfile } from '../../models/location/set-network-profile.js';
import { StatusNotification } from '../../models/location/status-notification.js';
import { MessageInfo } from '../../models/message-info/message-info.js';
import { OCPPMessage } from '../../models/ocpp-message.js';
import { Reservation } from '../../models/reservation.js';
import { SecurityEvent } from '../../models/security-event.js';
import { Subscription } from '../../models/subscription/subscription.js';
import { Tariff } from '../../models/tariff/tariffs.js';
import { Tenant } from '../../models/tenant.js';
import { TenantPartner } from '../../models/tenant-partner.js';
import { MeterValue } from '../../models/transaction-event/meter-value.js';
import { StartTransaction } from '../../models/transaction-event/start-transaction.js';
import { StopTransaction } from '../../models/transaction-event/stop-transaction.js';
import { Transaction } from '../../models/transaction-event/transaction.js';
import { TransactionEvent } from '../../models/transaction-event/transaction-event.js';
import { EventData } from '../../models/variable-monitoring/event-data.js';
import { VariableMonitoring } from '../../models/variable-monitoring/variable-monitoring.js';
import { VariableMonitoringStatus } from '../../models/variable-monitoring/variable-monitoring-status.js';

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
