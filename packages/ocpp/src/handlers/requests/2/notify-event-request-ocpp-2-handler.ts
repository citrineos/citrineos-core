// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type IMessage,
  type IOcppSender,
} from '@citrineos/base';
import {
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPP2_1,
  OCPP2_common_types,
  OCPP2_request_types,
  OCPP2_response_types,
  OCPPVersion,
} from '@citrineos/types';
import type {
  IComponentRepository,
  IVariableAttributeRepository,
  IVariableMonitoringRepository,
} from '@citrineos/dal';
import { OCPP2_1_Mapper } from '@citrineos/dal';
import type { ConnectorStatusService } from '@modules/monitoring/connector-status-service.js';

function isOcpp21ConnectorStatus(value: string): value is OCPP2_1.ConnectorStatusEnumType {
  return Object.values<string>(OCPP2_1.ConnectorStatusEnumType).includes(value);
}

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.NotifyEvent)
export class NotifyEventRequestOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _componentRepository: IComponentRepository;
  protected _variableAttributeRepository: IVariableAttributeRepository;
  protected _variableMonitoringRepository: IVariableMonitoringRepository;
  protected _connectorStatusService: ConnectorStatusService;

  constructor({
    logger,
    ocppSender,
    componentRepository,
    variableAttributeRepository,
    variableMonitoringRepository,
    connectorStatusService,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    componentRepository: IComponentRepository;
    variableAttributeRepository: IVariableAttributeRepository;
    variableMonitoringRepository: IVariableMonitoringRepository;
    connectorStatusService: ConnectorStatusService;
  }) {
    super(logger);

    this._ocppSender = ocppSender;
    this._componentRepository = componentRepository;
    this._variableAttributeRepository = variableAttributeRepository;
    this._variableMonitoringRepository = variableMonitoringRepository;
    this._connectorStatusService = connectorStatusService;
  }

  async handle(
    message: IMessage<OCPP2_request_types.NotifyEventRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug('Handler for NotifyEventRequest received message:', message, props);
    const ocppConnectionName = message.context.ocppConnectionName;

    const events = message.payload.eventData as OCPP2_common_types.EventDataType[];
    for (const event of events) {
      const [component, variable] =
        await this._componentRepository.findOrCreateEvseAndComponentAndVariable(
          message.context.tenantId,
          event.component,
          event.variable,
        );
      await this._variableMonitoringRepository.createEventDatumByComponentIdAndVariableIdAndStationId(
        message.context.tenantId,
        event,
        ocppConnectionName,
        component?.id,
        variable?.id,
      );
      const reportDataType: OCPP2_common_types.ReportDataType = {
        component,
        variable,
        variableAttribute: [
          {
            value: event.actualValue,
          },
        ],
      };
      await this._variableAttributeRepository.createOrUpdateDeviceModelByStationId(
        message.context.tenantId,
        reportDataType,
        ocppConnectionName,
        message.payload.generatedAt,
      );

      if (
        message.protocol === OCPPVersion.OCPP2_1 &&
        event.component.name === 'Connector' &&
        event.variable.name === 'AvailabilityState'
      ) {
        await this._updateConnectorStatus(message.context.tenantId, ocppConnectionName, event);
      }
    }

    const response: OCPP2_response_types.NotifyEventResponse = {};

    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug(
      this.createHandlerSentMessageLog('NotifyEventResponse'),
      messageConfirmation,
    );
  }

  private async _updateConnectorStatus(
    tenantId: number,
    ocppConnectionName: string,
    event: OCPP2_common_types.EventDataType,
  ): Promise<void> {
    const evseId = event.component.evse?.id;
    const connectorId = event.component.evse?.connectorId;
    if (evseId == null || connectorId == null) {
      this._logger.warn(
        `AvailabilityState event ${event.eventId} from ${ocppConnectionName} has no evse.id or evse.connectorId. Connector status not updated.`,
      );
      return;
    }
    if (!isOcpp21ConnectorStatus(event.actualValue)) {
      this._logger.warn(
        `AvailabilityState event ${event.eventId} from ${ocppConnectionName} has value ${event.actualValue}, which is not a connector status. Connector status not updated.`,
      );
      return;
    }

    try {
      await this._connectorStatusService.updateConnectorStatus(tenantId, ocppConnectionName, {
        evseId,
        connectorId,
        connectorStatus: OCPP2_1_Mapper.LocationMapper.mapConnectorStatus(event.actualValue),
        timestamp: event.timestamp,
      });
    } catch (error) {
      this._logger.error(
        `Failed to update connector status from AvailabilityState event ${event.eventId} from ${ocppConnectionName}`,
        error,
      );
    }
  }
}
