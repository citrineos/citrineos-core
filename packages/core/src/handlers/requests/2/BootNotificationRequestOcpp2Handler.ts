// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  CacheNamespace,
  createIdentifier,
  type ICache,
  type IMessage,
  type IMessageConfirmation,
  type IOcppSender,
  type IWebsocketConnection,
} from '@citrineos/base';
import {
  type BootDto,
  EventGroup,
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  RegistrationStatusEnum,
  type RegistrationStatusEnumType,
  ResetEnum,
  SetVariableStatusEnum,
  type SystemConfig,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/types';
import type { IDeviceModelRepository, ILocationRepository } from '@dal/interfaces/repositories.js';
import { ChargingStation } from '@dal/layers/sequelize/index.js';
import type { BootNotificationService } from '@modules/Configuration/src/module/BootNotificationService.js';
import type { DeviceModelService } from '@modules/Configuration/src/module/DeviceModelService.js';
import { v4 as uuidv4 } from 'uuid';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.BootNotification)
export class BootNotificationRequestOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _cache: ICache;
  protected _config: SystemConfig;
  protected _bootService: BootNotificationService;
  protected _deviceModelService: DeviceModelService;
  protected _deviceModelRepository: IDeviceModelRepository;
  protected _locationRepository: ILocationRepository;

  constructor({
    logger,
    ocppSender,
    cache,
    config,
    bootNotificationService,
    configurationDeviceModelService,
    deviceModelRepository,
    locationRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    cache: ICache;
    config: SystemConfig;
    bootNotificationService: BootNotificationService;
    configurationDeviceModelService: DeviceModelService;
    deviceModelRepository: IDeviceModelRepository;
    locationRepository: ILocationRepository;
  }) {
    super(logger);
    this._ocppSender = ocppSender;
    this._cache = cache;
    this._config = config;
    this._bootService = bootNotificationService;
    this._deviceModelService = configurationDeviceModelService;
    this._deviceModelRepository = deviceModelRepository;
    this._locationRepository = locationRepository;
  }

  async handle(
    message: IMessage<OCPP2_request_types.BootNotificationRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('BootNotificationRequest'),
      message,
      props,
    );

    const ocppConnectionName = message.context.ocppConnectionName;
    const tenantId = message.context.tenantId;
    const timestamp = message.context.timestamp;
    const chargingStation = message.payload.chargingStation;

    const bootNotificationResponse: OCPP2_response_types.BootNotificationResponse =
      await this._bootService.createBootNotificationResponse(tenantId, ocppConnectionName);

    // Check cached boot status for charger. Only Pending and Rejected statuses are cached.
    const cachedBootStatus: RegistrationStatusEnumType | null = await this._cache.get(
      CacheNamespace.BootStatus,
      ocppConnectionName,
    );

    // Blacklist or whitelist charger actions in cache
    await this._bootService.cacheChargerActionsPermissions(
      ocppConnectionName,
      cachedBootStatus,
      bootNotificationResponse.status,
    );

    const bootNotificationResponseMessageConfirmation: IMessageConfirmation =
      await this._ocppSender.sendCallResultWithMessage(message, bootNotificationResponse);

    // Update charging station first, then device model.
    // Order matters: updateDeviceModel creates VariableAttributes with a FK
    // reference to the ChargingStation record, so the station must exist first.
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
          chargePointVendor: chargingStation.vendorName,
          chargePointModel: chargingStation.model,
          chargePointSerialNumber: chargingStation.serialNumber,
          firmwareVersion: chargingStation.firmwareVersion,
          iccid: chargingStation.modem?.iccid,
          imsi: chargingStation.modem?.imsi,
        }),
      );
      await this._deviceModelService.updateDeviceModel(
        chargingStation,
        tenantId,
        ocppConnectionName,
        timestamp,
      );
    })().catch((error) => {
      this._logger.error(
        `Error updating station ${ocppConnectionName} or device model with boot info:`,
        error,
      );
    });

    if (!bootNotificationResponseMessageConfirmation.success) {
      throw new Error('BootNotification failed: ' + bootNotificationResponseMessageConfirmation);
    }

    if (
      bootNotificationResponse.status !== RegistrationStatusEnum.Accepted &&
      (!cachedBootStatus || bootNotificationResponse.status !== cachedBootStatus)
    ) {
      // Cache boot status for charger if (not accepted) and ((not already cached) or (different status from cached status)).
      await this._cache.set(
        CacheNamespace.BootStatus,
        bootNotificationResponse.status,
        ocppConnectionName,
      );
    }

    // Update charger-specific boot config with details of most recently sent BootNotificationResponse
    const bootConfigDbEntity: BootDto = await this._bootService.updateBootConfig(
      bootNotificationResponse,
      tenantId,
      ocppConnectionName,
    );

    // If boot notification is not pending, do not start configuration.
    // If cached boot status is not null and pending, configuration is already in progress - do not start configuration again.
    if (
      bootNotificationResponse.status !== RegistrationStatusEnum.Pending ||
      (cachedBootStatus && cachedBootStatus === RegistrationStatusEnum.Pending)
    ) {
      return;
    }

    // GetBaseReport
    // TODO Consider refactoring GetBaseReport and SetVariables sections as methods to be used by their respective message api endpoints as well
    if (bootConfigDbEntity.getBaseReportOnPending ?? this._config.ocpp.getBaseReportOnPending) {
      // Remove Notify Report from blacklist
      await this._cache.remove(OCPP_CallAction.NotifyReport, ocppConnectionName);

      const getBaseReportRequest = await this._bootService.createGetBaseReportRequest(
        ocppConnectionName,
        this._config.timeouts.maxCachingSeconds,
      );

      const getBaseReportConfirmation = await this._ocppSender.sendCall({
        ocppConnectionName,
        tenantId,
        protocol: message.protocol,
        action: OCPP_CallAction.GetBaseReport,
        eventGroup: EventGroup.Configuration,
        payload: getBaseReportRequest,
      });

      await this._bootService.confirmGetBaseReportSuccess(
        ocppConnectionName,
        getBaseReportRequest.requestId.toString(),
        getBaseReportConfirmation,
        this._config.timeouts.maxCachingSeconds,
      );

      // Make sure GetBaseReport doesn't re-trigger on next boot attempt
      await this._bootService.updateBoot(
        tenantId,
        { getBaseReportOnPending: false },
        ocppConnectionName,
      );
    }

    // SetVariables
    let rejectedSetVariable = false;
    let rebootSetVariable = false;
    if (
      bootConfigDbEntity.pendingBootSetVariables &&
      bootConfigDbEntity.pendingBootSetVariables.length > 0
    ) {
      bootConfigDbEntity.variablesRejectedOnLastBoot = [];

      let setVariableData: OCPP2_common_types.SetVariableDataType[] =
        await this._deviceModelRepository.readAllSetVariableByStationId(
          tenantId,
          ocppConnectionName,
        );

      // If ItemsPerMessageSetVariables not set, send all variables at once
      const itemsPerMessageSetVariables =
        (await this._deviceModelService.getItemsPerMessageSetVariablesByStationId(
          tenantId,
          ocppConnectionName,
        )) ?? setVariableData.length;

      while (setVariableData.length > 0) {
        const correlationId = uuidv4();

        const cacheCallbackPromise: Promise<string | null> = this._cache.onChange(
          correlationId,
          this._config.timeouts.maxCachingSeconds,
          ocppConnectionName,
        ); // x2 fudge factor for any network lag

        await this._ocppSender.sendCall({
          ocppConnectionName,
          tenantId,
          protocol: message.protocol,
          action: OCPP_CallAction.SetVariables,
          eventGroup: EventGroup.Configuration,
          payload: {
            setVariableData: setVariableData.slice(0, itemsPerMessageSetVariables),
          } as OCPP2_request_types.SetVariablesRequest,
          correlationId,
        });

        setVariableData = setVariableData.slice(itemsPerMessageSetVariables);

        const setVariablesResponseJsonString = await cacheCallbackPromise;

        if (setVariablesResponseJsonString) {
          if (rejectedSetVariable && rebootSetVariable) {
            continue;
          }

          const setVariablesResponse: OCPP2_response_types.SetVariablesResponse = JSON.parse(
            setVariablesResponseJsonString,
          );
          setVariablesResponse.setVariableResult.forEach((result) => {
            if (result.attributeStatus === SetVariableStatusEnum.Rejected) {
              rejectedSetVariable = true;
            } else if (result.attributeStatus === SetVariableStatusEnum.RebootRequired) {
              rebootSetVariable = true;
            }
          });
        } else {
          throw new Error('SetVariables response not found');
        }
      }

      const doNotBootWithRejectedVariables = !(
        (
          bootConfigDbEntity.bootWithRejectedVariables ??
          this._config.ocpp.bootWithRejectedVariables
        ) //TODO: When we add 2.1 config, we will need to adjust this logic to vary by message protocol
      );

      if (rejectedSetVariable && doNotBootWithRejectedVariables) {
        await this._bootService.updateBoot(
          tenantId,
          { status: RegistrationStatusEnum.Rejected },
          ocppConnectionName,
        );
        return;
      }
    }

<<<<<<< HEAD
    if (this._config.ocpp.autoAccept) {
      //TODO: When we add 2.1 config, we will need to adjust this logic to vary by message protocol
      // Update boot config with status accepted
=======
    if (this._config.modules.configuration.ocpp2_0_1?.autoAccept) {
      // TODO: When we add 2.1 config, we will need to adjust this logic to vary by message protocol
>>>>>>> next
      // TODO: Determine how/if StatusInfo should be generated
      await this._bootService.updateBoot(
        tenantId,
        { status: RegistrationStatusEnum.Accepted },
        ocppConnectionName,
      );
    }

    if (rebootSetVariable) {
      // Charger SHALL not be in a transaction as it has not yet successfully booted, therefore it
      // is appropriate to send an Immediate Reset
      await this._ocppSender.sendCall({
        ocppConnectionName,
        tenantId,
        protocol: message.protocol,
        action: OCPP_CallAction.Reset,
        eventGroup: EventGroup.Configuration,
        payload: {
          type: ResetEnum.Immediate,
        } as OCPP2_request_types.ResetRequest,
      });
    } else {
      // We could trigger the new boot immediately rather than wait for the retry, as nothing more now needs to be done.
      // However, B02.FR.02 - Spec allows for TriggerMessageRequest - OCTT fails over trigger
      // Commenting out until OCTT behavior changes.
      // this.sendCall(ocppConnectionName, tenantId, OCPPVersion.OCPP2_0_1, OCPP_CallAction.TriggerMessage,
      //   { requestedMessage: MessageTriggerEnumType.BootNotification } as TriggerMessageRequest);
    }
  }
}
