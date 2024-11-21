import {
  IAuthorizationRepository,
  IBootRepository,
  ICallMessageRepository,
  ICertificateRepository,
  IChargingProfileRepository,
  IChargingStationSequenceRepository,
  IDeleteCertificateAttemptRepository,
  IDeviceModelRepository,
  IInstallCertificateAttemptRepository,
  IInstalledCertificateRepository,
  ILocalAuthListRepository,
  ILocationRepository,
  IMessageInfoRepository,
  IReservationRepository,
  ISecurityEventRepository,
  ISubscriptionRepository,
  ITariffRepository,
  ITransactionEventRepository,
  IVariableMonitoringRepository,
} from '../../../interfaces';
import { CrudRepository, SystemConfig } from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import { SequelizeAuthorizationRepository } from './Authorization';
import { SequelizeBootRepository } from './Boot';
import { SequelizeCertificateRepository } from './Certificate';
import { SequelizeDeviceModelRepository } from './DeviceModel';
import { SequelizeLocationRepository } from './Location';
import { SequelizeMessageInfoRepository } from './MessageInfo';
import { SequelizeSecurityEventRepository } from './SecurityEvent';
import { SequelizeSubscriptionRepository } from './Subscription';
import { SequelizeTariffRepository } from './Tariff';
import { SequelizeTransactionEventRepository } from './TransactionEvent';
import { SequelizeVariableMonitoringRepository } from './VariableMonitoring';
import { Sequelize } from 'sequelize-typescript';
import { TransactionEvent } from '../model/TransactionEvent';
import { Component } from '../model/DeviceModel';
import { SequelizeRepository } from './Base';
import { SequelizeReservationRepository } from './Reservation';
import { SequelizeCallMessageRepository } from './CallMessage';
import { SequelizeLocalAuthListRepository } from './LocalAuthList';
import { SequelizeChargingStationSequenceRepository } from './ChargingStationSequence';
import { SequelizeChargingProfileRepository } from './ChargingProfile';
import { SequelizeInstalledCertificateRepository } from './InstalledCertificate';
import { SequelizeInstallCertificateAttemptRepository } from './InstallCertificateAttempt';
import { SequelizeDeleteCertificateAttemptRepository } from './DeleteCertificateAttempt';

export class RepositoryStore {
  sequelizeInstance: Sequelize;
  authorizationRepository: IAuthorizationRepository;
  bootRepository: IBootRepository;
  callMessageRepository: ICallMessageRepository;
  certificateRepository: ICertificateRepository;
  installedCertificateRepository: IInstalledCertificateRepository;
  installCertificateAttemptRepository: IInstallCertificateAttemptRepository;
  deleteCertificateAttemptRepository: IDeleteCertificateAttemptRepository;
  deviceModelRepository: IDeviceModelRepository;
  localAuthListRepository: ILocalAuthListRepository;
  locationRepository: ILocationRepository;
  messageInfoRepository: IMessageInfoRepository;
  reservationRepository: IReservationRepository;
  securityEventRepository: ISecurityEventRepository;
  subscriptionRepository: ISubscriptionRepository;
  tariffRepository: ITariffRepository;
  transactionEventRepository: ITransactionEventRepository;
  variableMonitoringRepository: IVariableMonitoringRepository;
  componentRepository: CrudRepository<Component>;
  chargingStationSequenceRepository: IChargingStationSequenceRepository;
  chargingProfileRepository: IChargingProfileRepository;

  constructor(config: SystemConfig, logger: Logger<ILogObj>, sequelizeInstance: Sequelize) {
    this.sequelizeInstance = sequelizeInstance;
    this.authorizationRepository = new SequelizeAuthorizationRepository(config, logger, sequelizeInstance);
    this.bootRepository = new SequelizeBootRepository(config, logger, sequelizeInstance);
    this.callMessageRepository = new SequelizeCallMessageRepository(config, logger, sequelizeInstance);
    this.certificateRepository = new SequelizeCertificateRepository(config, logger, sequelizeInstance);
    this.installedCertificateRepository = new SequelizeInstalledCertificateRepository(config, logger, sequelizeInstance);
    this.installCertificateAttemptRepository = new SequelizeInstallCertificateAttemptRepository(config, logger, sequelizeInstance);
    this.deleteCertificateAttemptRepository = new SequelizeDeleteCertificateAttemptRepository(config, logger, sequelizeInstance);
    this.deviceModelRepository = new SequelizeDeviceModelRepository(config, logger, sequelizeInstance);
    this.localAuthListRepository = new SequelizeLocalAuthListRepository(config, logger, sequelizeInstance);
    this.locationRepository = new SequelizeLocationRepository(config, logger, sequelizeInstance);
    this.messageInfoRepository = new SequelizeMessageInfoRepository(config, logger, sequelizeInstance);
    this.reservationRepository = new SequelizeReservationRepository(config, logger, sequelizeInstance);
    this.securityEventRepository = new SequelizeSecurityEventRepository(config, logger, sequelizeInstance);
    this.subscriptionRepository = new SequelizeSubscriptionRepository(config, logger, sequelizeInstance);
    this.tariffRepository = new SequelizeTariffRepository(config, logger, sequelizeInstance);
    this.transactionEventRepository = new SequelizeTransactionEventRepository(config, logger, TransactionEvent.MODEL_NAME, sequelizeInstance);
    this.variableMonitoringRepository = new SequelizeVariableMonitoringRepository(config, logger, sequelizeInstance);
    this.componentRepository = new SequelizeRepository<Component>(config, Component.MODEL_NAME, logger);
    this.chargingStationSequenceRepository = new SequelizeChargingStationSequenceRepository(config, logger, sequelizeInstance);
    this.chargingProfileRepository = new SequelizeChargingProfileRepository(config, logger, sequelizeInstance);
  }
}
