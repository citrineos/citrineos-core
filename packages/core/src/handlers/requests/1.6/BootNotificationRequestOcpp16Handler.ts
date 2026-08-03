// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type BootstrapConfig,
  CacheNamespace,
  createIdentifier,
  type ICache,
  type IMessage,
  type IMessageConfirmation,
  type IOcppSender,
  type IWebsocketConnection,
} from '@citrineos/base';
import {
  EventGroup,
  type HandlerProperties,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
  type SystemConfig,
} from '@citrineos/types';
import type {
  IBootRepository,
  IChangeConfigurationRepository,
  ILocationRepository,
} from '@dal/interfaces/repositories.js';
import { ChangeConfiguration, ChargingStation } from '@dal/layers/sequelize/index.js';
import type { BootNotificationService } from '@modules/Configuration/src/module/BootNotificationService.js';
import { v4 as uuidv4 } from 'uuid';

@AsRequestHandler([OCPPVersion.OCPP1_6], OCPP_CallAction.BootNotification)
export class BootNotificationRequestOcpp16Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _cache: ICache;
  protected _config: BootstrapConfig & SystemConfig;
  protected _bootService: BootNotificationService;
  protected _bootRepository: IBootRepository;
  protected _changeConfigurationRepository: IChangeConfigurationRepository;
  protected _locationRepository: ILocationRepository;

  constructor({
    logger,
    ocppSender,
    cache,
    config,
    bootNotificationService,
    bootRepository,
    changeConfigurationRepository,
    locationRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    cache: ICache;
    config: BootstrapConfig & SystemConfig;
    bootNotificationService: BootNotificationService;
    bootRepository: IBootRepository;
    changeConfigurationRepository: IChangeConfigurationRepository;
    locationRepository: ILocationRepository;
  }) {
    super(logger);
    this._ocppSender = ocppSender;
    this._cache = cache;
    this._config = config;
    this._bootService = bootNotificationService;
    this._bootRepository = bootRepository;
    this._changeConfigurationRepository = changeConfigurationRepository;
    this._locationRepository = locationRepository;
  }

  async handle(
    message: IMessage<OCPP1_6.BootNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('BootNotificationRequest'),
      message,
      props,
    );

    const ocppConnectionName = message.context.ocppConnectionName;
    const tenantId = message.context.tenantId;
    const request = message.payload;

    // 1. Send BootNotification response
    const bootNotificationResponse: OCPP1_6.BootNotificationResponse =
      await this._bootService.createOcpp16BootNotificationResponse(tenantId, ocppConnectionName);
    // Check cached boot status for charger. Only Pending and Rejected statuses are cached.
    const cachedBootStatus: OCPP1_6.BootNotificationResponseStatus | null = await this._cache.get(
      CacheNamespace.BootStatus,
      ocppConnectionName,
    );
    // Blacklist or whitelist charger actions
    await this._bootService.cacheOcpp16ChargerActionsPermissions(
      ocppConnectionName,
      cachedBootStatus,
      bootNotificationResponse.status,
    );
    // Send BootNotification response
    const bootNotificationResponseMessageConfirmation: IMessageConfirmation =
      await this._ocppSender.sendCallResultWithMessage(message, bootNotificationResponse);
    // Create or update charging station
    this._logger.debug(`Creating or updating charging station: ${ocppConnectionName}`);
    (async () => {
      const connectionJson = await this._cache.get<string>(
        createIdentifier(tenantId, ocppConnectionName),
        CacheNamespace.Connections,
      );
      const connection: IWebsocketConnection | null = connectionJson
        ? JSON.parse(connectionJson)
        : null;
      if (!connection?.allowUnknownChargingStations) {
        const exists = await this._locationRepository.doesChargingStationExistByStationId(
          tenantId,
          ocppConnectionName,
        );
        if (!exists) {
          throw new Error(
            `Charging station ${ocppConnectionName} does not exist and allowUnknownChargingStations is false`,
          );
        }
      }
      await this._locationRepository.createOrUpdateChargingStation(
        tenantId,
        ChargingStation.build({
          tenantId,
          ocppConnectionName,
          chargePointVendor: request.chargePointVendor,
          chargePointModel: request.chargePointModel,
          chargePointSerialNumber: request.chargePointSerialNumber,
          chargeBoxSerialNumber: request.chargeBoxSerialNumber,
          firmwareVersion: request.firmwareVersion,
          iccid: request.iccid,
          imsi: request.imsi,
          meterType: request.meterType,
          meterSerialNumber: request.meterSerialNumber,
        }),
      );
    })().catch((error) => {
      this._logger.error(`Error updating station ${ocppConnectionName} with boot info:`, error);
    });
    // Check if response was successful
    if (!bootNotificationResponseMessageConfirmation.success) {
      throw new Error(
        'Send BootNotification response failed: ' + bootNotificationResponseMessageConfirmation,
      );
    }

    // 2. Update boot status in cache and db entity
    // Cache boot status for charger if (not accepted) and ((not already cached) or (different status from cached status)).
    if (
      bootNotificationResponse.status !== OCPP1_6.BootNotificationResponseStatus.Accepted &&
      (!cachedBootStatus || bootNotificationResponse.status !== cachedBootStatus)
    ) {
      await this._cache.set(
        CacheNamespace.BootStatus,
        bootNotificationResponse.status,
        ocppConnectionName,
      );
    }
    // Update boot with details of most recently sent BootNotificationResponse
    const bootEntity = await this._bootService.updateOcpp16BootConfig(
      bootNotificationResponse,
      tenantId,
      ocppConnectionName,
    );

    // 3. Sync configurations
    // If boot notification is not pending, do not start configuration.
    // If cached boot status is not null and pending, configuration is already in progress - do not start configuration again.
    if (
      bootNotificationResponse.status !== OCPP1_6.BootNotificationResponseStatus.Pending ||
      (cachedBootStatus && cachedBootStatus === OCPP1_6.BootNotificationResponseStatus.Pending)
    ) {
      return;
    }
    let changeConfigurationsOnPending: boolean = false;
    let getConfigurationsOnPending: boolean = true;
    // Change Configurations on charging station
    const configurations: ChangeConfiguration[] =
      await this._changeConfigurationRepository.readAllByQuery(tenantId, {
        where: {
          ocppConnectionName,
        },
      });
    // Remove ChangeConfiguration call action from blacklist
    await this._cache.remove(OCPP_CallAction.ChangeConfiguration, ocppConnectionName);
    // Set each configuration on Charging Station
    for (const config of configurations) {
      const correlationId = uuidv4();

      const cacheCallbackPromise: Promise<string | null> = this._cache.onChange(
        correlationId,
        this._config.maxCachingSeconds,
        ocppConnectionName,
      );
      const changeConfigurationResponseMessageConfirmation: IMessageConfirmation =
        await this._ocppSender.sendCall({
          ocppConnectionName,
          tenantId,
          protocol: OCPPVersion.OCPP1_6,
          action: OCPP_CallAction.ChangeConfiguration,
          eventGroup: EventGroup.Configuration,
          payload: {
            key: config.key,
            value: config.value,
          } as OCPP1_6.ChangeConfigurationRequest,
          correlationId,
        });
      if (!changeConfigurationResponseMessageConfirmation.success) {
        changeConfigurationsOnPending = true;
      }
      // wait before sending next call
      await cacheCallbackPromise;
    }

    // Get Configurations from charging station
    // Remove GetConfiguration call action from blacklist
    await this._cache.remove(OCPP_CallAction.GetConfiguration, ocppConnectionName);
    // Send GetConfiguration request to charger
    const getConfigurationResponseMessageConfirmation: IMessageConfirmation =
      await this._ocppSender.sendCall({
        ocppConnectionName,
        tenantId,
        protocol: OCPPVersion.OCPP1_6,
        action: OCPP_CallAction.GetConfiguration,
        eventGroup: EventGroup.Configuration,
        payload: {} as OCPP1_6.GetConfigurationRequest, // empty to get all configs
      });
    if (getConfigurationResponseMessageConfirmation.success) {
      getConfigurationsOnPending = false;
    }
    // Update configuration related fields on boot entity
    await this._bootRepository.updateByKey(
      tenantId,
      {
        changeConfigurationsOnPending,
        getConfigurationsOnPending,
      },
      bootEntity.id,
    );

    // 4. Trigger another boot when pending
    await this._cache.remove(OCPP_CallAction.TriggerMessage, ocppConnectionName);
    await this._ocppSender.sendCall({
      ocppConnectionName,
      tenantId,
      protocol: OCPPVersion.OCPP1_6,
      action: OCPP_CallAction.TriggerMessage,
      eventGroup: EventGroup.Configuration,
      payload: {
        requestedMessage: OCPP1_6.TriggerMessageRequestRequestedMessage.BootNotification,
      } as OCPP1_6.TriggerMessageRequest,
    });
  }
}
