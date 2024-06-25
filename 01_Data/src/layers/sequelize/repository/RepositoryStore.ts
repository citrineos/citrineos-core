import {
  IAuthorizationRepository,
  IBootRepository,
  ICertificateRepository,
  IDeviceModelRepository,
  ILocationRepository,
  IMessageInfoRepository,
  ISecurityEventRepository,
  ISubscriptionRepository,
  ITariffRepository,
  ITransactionEventRepository,
  IVariableMonitoringRepository
} from "../../../interfaces";
import {SystemConfig} from "@citrineos/base";
import {ILogObj, Logger} from "tslog";
import {SequelizeAuthorizationRepository} from "./Authorization";
import {SequelizeBootRepository} from "./Boot";
import {SequelizeCertificateRepository} from "./Certificate";
import {SequelizeDeviceModelRepository} from "./DeviceModel";
import {SequelizeLocationRepository} from "./Location";
import {SequelizeMessageInfoRepository} from "./MessageInfo";
import {SequelizeSecurityEventRepository} from "./SecurityEvent";
import {SequelizeSubscriptionRepository} from "./Subscription";
import {SequelizeTariffRepository} from "./Tariff";
import {SequelizeTransactionEventRepository} from "./TransactionEvent";
import {SequelizeVariableMonitoringRepository} from "./VariableMonitoring";
import {Sequelize} from "sequelize-typescript";
import {TransactionEvent} from "../model/TransactionEvent";

export class RepositoryStore {
  sequelizeInstance: Sequelize;
  authorizationRepository: IAuthorizationRepository;
  bootRepository: IBootRepository;
  certificateRepository: ICertificateRepository;
  deviceModelRepository: IDeviceModelRepository;
  locationRepository: ILocationRepository;
  messageInfoRepository: IMessageInfoRepository;
  securityEventRepository: ISecurityEventRepository;
  subscriptionRepository: ISubscriptionRepository;
  tariffRepository: ITariffRepository;
  transactionEventRepository: ITransactionEventRepository;
  variableMonitoringRepository: IVariableMonitoringRepository;

  constructor(
    config: SystemConfig,
    logger: Logger<ILogObj>,
    sequelizeInstance: Sequelize
  ) {
    this.sequelizeInstance = sequelizeInstance;
    this.authorizationRepository = new SequelizeAuthorizationRepository(config, logger, sequelizeInstance);
    this.bootRepository = new SequelizeBootRepository(config, logger, sequelizeInstance);
    this.certificateRepository = new SequelizeCertificateRepository(config, logger, sequelizeInstance);
    this.deviceModelRepository = new SequelizeDeviceModelRepository(config, logger, sequelizeInstance);
    this.locationRepository = new SequelizeLocationRepository(config, logger, sequelizeInstance);
    this.messageInfoRepository = new SequelizeMessageInfoRepository(config, logger, sequelizeInstance);
    this.securityEventRepository = new SequelizeSecurityEventRepository(config, logger, sequelizeInstance);
    this.subscriptionRepository = new SequelizeSubscriptionRepository(config, logger, sequelizeInstance);
    this.tariffRepository = new SequelizeTariffRepository(config, logger, sequelizeInstance);
    this.transactionEventRepository = new SequelizeTransactionEventRepository(config, logger, TransactionEvent.MODEL_NAME, sequelizeInstance);
    this.variableMonitoringRepository = new SequelizeVariableMonitoringRepository(config, logger, sequelizeInstance);
  }
}
