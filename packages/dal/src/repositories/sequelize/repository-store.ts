// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { CrudRepository } from '@citrineos/base';
import type { SystemConfig } from '@citrineos/types';
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
} from '../repositories.js';
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
  DrizzleTariffRepository,
  DrizzleTenantRepository,
  DrizzleVariableAttributeRepository,
} from '../../db/drizzle/index.js';
import type { Component } from '../../models/device-model/component.js';
import { SequelizeAuthorizationRepository } from './authorization.js';
import { SequelizeBootRepository } from './boot.js';
import { SequelizeCertificateRepository } from './certificate.js';
import { SequelizeChangeConfigurationRepository } from './change-configuration.js';
import { SequelizeChargingProfileRepository } from './charging-profile.js';
import { SequelizeChargingStationSequenceRepository } from './charging-station-sequence.js';
import { SequelizeComponentRepository } from './component.js';
import { SequelizeDeleteCertificateAttemptRepository } from './delete-certificate-attempt.js';
import { SequelizeDeviceModelRepository } from './device-model.js';
import { SequelizeInstallCertificateAttemptRepository } from './install-certificate-attempt.js';
import { SequelizeInstalledCertificateRepository } from './installed-certificate.js';
import { SequelizeLocalAuthListRepository } from './local-auth-list.js';
import { SequelizeLocationRepository } from './location.js';
import { SequelizeMessageInfoRepository } from './message-info.js';
import { SequelizeOCPPMessageRepository } from './ocpp-message.js';
import { SequelizeReservationRepository } from './reservation.js';
import { SequelizeSecurityEventRepository } from './security-event.js';
import { SequelizeServerNetworkProfileRepository } from './server-network-profile.js';
import { SequelizeSubscriptionRepository } from './subscription.js';
import { SequelizeTariffRepository } from './tariff.js';
import { SequelizeTenantRepository } from './tenant.js';
import { SequelizeTransactionEventRepository } from './transaction-event.js';
import { SequelizeVariableMonitoringRepository } from './variable-monitoring.js';
import { DrizzleBootRepository } from '@dal/repositories/drizzle/boot.js';

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
    config: SystemConfig;
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
      this.tariffRepository = new DrizzleTariffRepository({ config, logger });
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
      this.tariffRepository = new SequelizeTariffRepository({ config, logger, sequelizeInstance });
    }

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
