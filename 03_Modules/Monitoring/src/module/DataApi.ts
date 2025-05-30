// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { ILogObj, Logger } from 'tslog';
import { IMonitoringModuleApi } from './interface';
import { MonitoringModule } from './module';
import {
  Component,
  CreateOrUpdateVariableAttributeQuerySchema,
  CreateOrUpdateVariableAttributeQuerystring,
  sequelize,
  Variable,
  VariableAttributeQuerySchema,
  VariableAttributeQuerystring,
} from '@citrineos/data';
import {
  AbstractModuleApi,
  AsDataEndpoint,
  HttpMethod,
  OCPP2_0_1_Namespace,
  OCPP2_0_1,
  ReportDataTypeSchema,
  OCPP1_6_Namespace,
  Namespace,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import { FastifyInstance, FastifyRequest } from 'fastify';

/**
 * Server API for the Monitoring module.
 */
export class MonitoringDataApi
  extends AbstractModuleApi<MonitoringModule>
  implements IMonitoringModuleApi
{
  /**
   * Constructor for the class.
   *
   * @param {MonitoringModule} monitoringModule - The monitoring module.
   * @param {FastifyInstance} server - The server instance.
   * @param {Logger<ILogObj>} [logger] - The logger instance.
   */
  constructor(
    monitoringModule: MonitoringModule,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
  ) {
    super(monitoringModule, server, null, logger);
  }

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.VariableAttributeType,
    HttpMethod.Put,
    CreateOrUpdateVariableAttributeQuerySchema,
    ReportDataTypeSchema,
  )
  async putDeviceModelVariables(
    request: FastifyRequest<{
      Body: OCPP2_0_1.ReportDataType;
      Querystring: CreateOrUpdateVariableAttributeQuerystring;
    }>,
  ): Promise<sequelize.VariableAttribute[]> {
    const tenantId = request.query.tenantId ?? DEFAULT_TENANT_ID;

    // fill in default values where omitted
    for (const variableAttr of request.body.variableAttribute) {
      if (!variableAttr.mutability) {
        variableAttr.mutability = OCPP2_0_1.MutabilityEnumType.ReadWrite;
      }
    }
    const timestamp = new Date().toISOString();
    const variableAttributes =
      await this._module.deviceModelRepository.createOrUpdateDeviceModelByStationId(
        tenantId,
        request.body,
        request.query.stationId,
        timestamp,
      );

    if (request.query.setOnCharger) {
      // Mark them as Accepted (set on the charger outside of OCPP communication)
      for (let variableAttribute of variableAttributes) {
        variableAttribute = await variableAttribute.reload({
          include: [Variable, Component],
        });
        await this._module.deviceModelRepository.updateResultByStationId(
          tenantId,
          {
            attributeType: variableAttribute.type,
            attributeStatus: OCPP2_0_1.SetVariableStatusEnumType.Accepted,
            attributeStatusInfo: { reasonCode: 'SetOnCharger' },
            component: variableAttribute.component,
            variable: variableAttribute.variable,
          },
          request.query.stationId,
          timestamp,
        );
      }
    }
    return variableAttributes;
  }

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.VariableAttributeType,
    HttpMethod.Get,
    VariableAttributeQuerySchema,
  )
  getDeviceModelVariables(
    request: FastifyRequest<{ Querystring: VariableAttributeQuerystring }>,
  ): Promise<sequelize.VariableAttribute[] | undefined> {
    return this._module.deviceModelRepository.readAllByQuerystring(
      request.query.tenantId,
      request.query,
    );
  }

  @AsDataEndpoint(
    OCPP2_0_1_Namespace.VariableAttributeType,
    HttpMethod.Delete,
    VariableAttributeQuerySchema,
  )
  deleteDeviceModelVariables(
    request: FastifyRequest<{ Querystring: VariableAttributeQuerystring }>,
  ): Promise<string> {
    const tenantId = request.query.tenantId ?? DEFAULT_TENANT_ID;
    request.query.tenantId = tenantId;
    return this._module.deviceModelRepository
      .deleteAllByQuerystring(tenantId, request.query)
      .then(
        (deletedCount) =>
          deletedCount.toString() +
          ' rows successfully deleted from ' +
          OCPP2_0_1_Namespace.VariableAttributeType,
      );
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace}
   * and the module's endpoint prefix configuration.
   *
   * @param {Namespace} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: OCPP2_0_1_Namespace | OCPP1_6_Namespace | Namespace): string {
    const endpointPrefix = this._module.config.modules.monitoring.endpointPrefix;
    return super._toDataPath(input, endpointPrefix);
  }
}
