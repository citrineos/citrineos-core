import {
  Component,
  Evse,
  IDeviceModelRepository,
  ILocationRepository,
  OCPP1_6_Mapper,
  Variable,
  Connector,
  OCPP2_0_1_Mapper,
} from '@citrineos/data';
import { ILogObj, Logger } from 'tslog';
import { CrudRepository, OCPP2_0_1, OCPP1_6 } from '@citrineos/base';

export class StatusNotificationService {
  protected _componentRepository: CrudRepository<Component>;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _locationRepository: ILocationRepository;
  protected _logger: Logger<ILogObj>;

  constructor(
    componentRepository: CrudRepository<Component>,
    deviceModelRepository: IDeviceModelRepository,
    locationRepository: ILocationRepository,
    logger?: Logger<ILogObj>,
  ) {
    this._componentRepository = componentRepository;
    this._deviceModelRepository = deviceModelRepository;
    this._locationRepository = locationRepository;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  /**
   * Stores an internal record of the incoming status, then updates the device model for the updated connector.
   *
   * @param {string} stationId - The Charging Station sending the status notification request
   * @param {StatusNotificationRequest} statusNotificationRequest
   */
  async processStatusNotification(
    stationId: string,
    statusNotificationRequest: OCPP2_0_1.StatusNotificationRequest,
  ) {
    const chargingStation =
      await this._locationRepository.readChargingStationByStationId(stationId);
    if (chargingStation) {
      const mapper = OCPP2_0_1_Mapper.StatusNotificationMapper.fromRequest(
        stationId,
        statusNotificationRequest,
      );
      await this._locationRepository.addStatusNotificationToChargingStation(
        stationId,
        mapper.toModel(),
      );
    } else {
      this._logger.warn(
        `Charging station ${stationId} not found. Status notification cannot be associated with a charging station.`,
      );
    }

    const component = await this._componentRepository.readOnlyOneByQuery({
      where: {
        name: 'Connector',
      },
      include: [
        {
          model: Evse,
          where: {
            id: statusNotificationRequest.evseId,
            connectorId: statusNotificationRequest.connectorId,
          },
        },
        {
          model: Variable,
          where: {
            name: 'AvailabilityState',
          },
        },
      ],
    });
    const variable = component?.variables?.[0];
    if (!component || !variable) {
      this._logger.warn(
        'Missing component or variable for status notification. Status notification cannot be assigned to device model.',
      );
    } else {
      const reportDataType: OCPP2_0_1.ReportDataType = {
        component: component,
        variable: variable,
        variableAttribute: [
          {
            value: statusNotificationRequest.connectorStatus,
          },
        ],
      };
      await this._deviceModelRepository.createOrUpdateDeviceModelByStationId(
        reportDataType,
        stationId,
        statusNotificationRequest.timestamp,
      );
    }
  }

  async processOcpp16StatusNotification(
    stationId: string,
    statusNotificationRequest: OCPP1_6.StatusNotificationRequest,
  ) {
    const chargingStation =
      await this._locationRepository.readChargingStationByStationId(stationId);
    if (chargingStation) {
      const statusNotificationMapper =
        OCPP1_6_Mapper.StatusNotificationMapper.fromRequest(
          stationId,
          statusNotificationRequest,
        );

      this._logger.debug(
        `[TESTING] status notification mapper: ${JSON.stringify(statusNotificationMapper)}`,
      );
      this._logger.debug(
        `[TESTING] status notification to model: ${JSON.stringify(statusNotificationMapper.toModel())}`,
      );
      const storedStatusNotification =
        await this._locationRepository.addStatusNotificationToChargingStation(
          stationId,
          statusNotificationMapper.toModel(),
        );
      this._logger.debug(
        `[TESTING] status notification entity: ${JSON.stringify(storedStatusNotification)}`,
      );

      const connector = {
        connectorId: statusNotificationRequest.connectorId,
        stationId,
      } as Connector;
      await this._locationRepository.createOrUpdateConnector(
        connector,
        storedStatusNotification,
      );
    } else {
      this._logger.warn(
        `Charging station ${stationId} not found. Status notification cannot be associated with a charging station.`,
      );
    }
  }
}
