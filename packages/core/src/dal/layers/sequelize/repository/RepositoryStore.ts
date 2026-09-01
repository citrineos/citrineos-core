// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { type BootstrapConfig, CrudRepository } from '@citrineos/base';
import { Sequelize } from 'sequelize-typescript';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type {
  IAuthorizationRepository,
  IBootRepository,
  ICertificateRepository,
  IChangeConfigurationRepository,
  IChargingProfileRepository,
  IChargingStationSequenceRepository,
  IDeleteCertificateAttemptRepository,
  IDeviceModelRepository,
  IInstallCertificateAttemptRepository,
  IInstalledCertificateRepository,
  ILocalAuthListRepository,
  ILocationRepository,
  IMessageInfoRepository,
  IOCPPMessageRepository,
  IReservationRepository,
  ISecurityEventRepository,
  IServerNetworkProfileRepository,
  ISubscriptionRepository,
  ITariffRepository,
  ITenantRepository,
  ITransactionEventRepository,
  IVariableMonitoringRepository,
} from '../../../interfaces/repositories.js';
import {
  DrizzleAuthorizationRepository,
  DrizzleCertificateRepository,
  DrizzleChangeConfigurationRepository,
  DrizzleDeleteCertificateAttemptRepository,
  DrizzleInstallCertificateAttemptRepository,
  DrizzleInstalledCertificateRepository,
  DrizzleSecurityEventRepository,
  DrizzleServerNetworkProfileRepository,
  DrizzleSubscriptionRepository,
  DrizzleTenantRepository,
  DrizzleVariableAttributeRepository,
} from '../../drizzle/index.js';
import type { Component } from '../model/DeviceModel/Component.js';
import { SequelizeAuthorizationRepository } from './Authorization.js';
import { SequelizeBootRepository } from './Boot.js';
import { SequelizeCertificateRepository } from './Certificate.js';
import { SequelizeComponentRepository } from './Component.js';
import { SequelizeChangeConfigurationRepository } from './ChangeConfiguration.js';
import { SequelizeChargingProfileRepository } from './ChargingProfile.js';
import { SequelizeChargingStationSequenceRepository } from './ChargingStationSequence.js';
import { SequelizeDeleteCertificateAttemptRepository } from './DeleteCertificateAttempt.js';
import { SequelizeDeviceModelRepository } from './DeviceModel.js';
import { SequelizeInstallCertificateAttemptRepository } from './InstallCertificateAttempt.js';
import { SequelizeInstalledCertificateRepository } from './InstalledCertificate.js';
import { SequelizeLocalAuthListRepository } from './LocalAuthList.js';
import { SequelizeLocationRepository } from './Location.js';
import { SequelizeMessageInfoRepository } from './MessageInfo.js';
import { SequelizeOCPPMessageRepository } from './OCPPMessage.js';
import { SequelizeReservationRepository } from './Reservation.js';
import { SequelizeSecurityEventRepository } from './SecurityEvent.js';
import { SequelizeServerNetworkProfileRepository } from './ServerNetworkProfile.js';
import { SequelizeSubscriptionRepository } from './Subscription.js';
import { SequelizeTariffRepository } from './Tariff.js';
import { SequelizeTenantRepository } from './Tenant.js';
import { SequelizeTransactionEventRepository } from './TransactionEvent.js';
import { SequelizeVariableMonitoringRepository } from './VariableMonitoring.js';
import { DrizzleBootRepository } from '@dal/layers/drizzle/repository/Boot.js';

export class RepositoryStore {
  sequelizeInstance: Sequelize;
  authorizationRepository: IAuthorizationRepository;
  bootRepository: IBootRepository;
  certificateRepository: ICertificateRepository;
  installedCertificateRepository: IInstalledCertificateRepository;
  installCertificateAttemptRepository: IInstallCertificateAttemptRepository;
  deleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
  changeConfigurationRepository: IChangeConfigurationRepository;
  chargingProfileRepository: IChargingProfileRepository;
  chargingStationSequenceRepository: IChargingStationSequenceRepository;
  componentRepository: CrudRepository<Component>;
  deviceModelRepository: IDeviceModelRepository;
  localAuthListRepository: ILocalAuthListRepository;
  locationRepository: ILocationRepository;
  messageInfoRepository: IMessageInfoRepository;
  ocppMessageRepository: IOCPPMessageRepository;
  reservationRepository: IReservationRepository;
  securityEventRepository: ISecurityEventRepository;
  subscriptionRepository: ISubscriptionRepository;
  tariffRepository: ITariffRepository;
  transactionEventRepository: ITransactionEventRepository;
  variableMonitoringRepository: IVariableMonitoringRepository;
  tenantRepository: ITenantRepository;
  serverNetworkProfileRepository: IServerNetworkProfileRepository;

  constructor({
    config,
    logger,
    sequelizeInstance,
  }: {
    config: BootstrapConfig;
    logger: Logger<ILogObj>;
    sequelizeInstance: Sequelize;
  }) {
    this.sequelizeInstance = sequelizeInstance;
    this.chargingProfileRepository = new SequelizeChargingProfileRepository({
      config,
      logger,
      sequelizeInstance,
    });
    this.chargingStationSequenceRepository = new SequelizeChargingStationSequenceRepository({
      config,
      logger,
      sequelizeInstance,
    });
    this.componentRepository = new SequelizeComponentRepository({
      config,
      logger,
      sequelizeInstance,
    });
    this.deviceModelRepository = new SequelizeDeviceModelRepository({
      config,
      logger,
      sequelizeInstance,
    });
    this.localAuthListRepository = new SequelizeLocalAuthListRepository({
      config,
      logger,
      sequelizeInstance,
    });
    this.locationRepository = new SequelizeLocationRepository({
      config,
      logger,
      sequelizeInstance,
    });
    this.messageInfoRepository = new SequelizeMessageInfoRepository({
      config,
      logger,
      sequelizeInstance,
    });
    this.ocppMessageRepository = new SequelizeOCPPMessageRepository({
      config,
      logger,
      sequelizeInstance,
    });
    this.reservationRepository = new SequelizeReservationRepository({
      config,
      logger,
      sequelizeInstance,
    });
    if (process.env.CITRINEOS_USE_DRIZZLE === 'true') {
      this.authorizationRepository = new DrizzleAuthorizationRepository({ config, logger });
      this.bootRepository = new DrizzleBootRepository({
        config,
        logger,
        variableAttributeRepository: new DrizzleVariableAttributeRepository({ config, logger }),
      });
      this.certificateRepository = new DrizzleCertificateRepository({ config, logger });
      this.changeConfigurationRepository = new DrizzleChangeConfigurationRepository({
        config,
        logger,
      });
      this.deleteCertificateAttemptRepository = new DrizzleDeleteCertificateAttemptRepository({
        config,
        logger,
      });
      this.installCertificateAttemptRepository = new DrizzleInstallCertificateAttemptRepository({
        config,
        logger,
      });
      this.installedCertificateRepository = new DrizzleInstalledCertificateRepository({
        config,
        logger,
      });
      this.securityEventRepository = new DrizzleSecurityEventRepository({ config, logger });
      this.subscriptionRepository = new DrizzleSubscriptionRepository({ config, logger });
      this.tenantRepository = new DrizzleTenantRepository({ config, logger });
      this.serverNetworkProfileRepository = new DrizzleServerNetworkProfileRepository({
        config,
        logger,
      });
    } else {
      this.authorizationRepository = new SequelizeAuthorizationRepository({
        config,
        logger,
        sequelizeInstance,
      });
      this.bootRepository = new SequelizeBootRepository({ config, logger, sequelizeInstance });
      this.certificateRepository = new SequelizeCertificateRepository({
        config,
        logger,
        sequelizeInstance,
      });
      this.changeConfigurationRepository = new SequelizeChangeConfigurationRepository({
        config,
        logger,
        sequelizeInstance,
      });
      this.deleteCertificateAttemptRepository = new SequelizeDeleteCertificateAttemptRepository({
        config,
        logger,
        sequelizeInstance,
      });
      this.installCertificateAttemptRepository = new SequelizeInstallCertificateAttemptRepository({
        config,
        logger,
        sequelizeInstance,
      });
      this.installedCertificateRepository = new SequelizeInstalledCertificateRepository({
        config,
        logger,
        sequelizeInstance,
      });
      this.securityEventRepository = new SequelizeSecurityEventRepository({
        config,
        logger,
        sequelizeInstance,
      });
      this.subscriptionRepository = new SequelizeSubscriptionRepository({
        config,
        logger,
        sequelizeInstance,
      });
      this.tenantRepository = new SequelizeTenantRepository({ config, logger, sequelizeInstance });
      this.serverNetworkProfileRepository = new SequelizeServerNetworkProfileRepository({
        config,
        logger,
        sequelizeInstance,
      });
    }

    this.tariffRepository = new SequelizeTariffRepository({ config, logger, sequelizeInstance });
    this.transactionEventRepository = new SequelizeTransactionEventRepository({
      config,
      logger,
      sequelizeInstance,
    });
    this.variableMonitoringRepository = new SequelizeVariableMonitoringRepository({
      config,
      logger,
      sequelizeInstance,
    });
  }
}
