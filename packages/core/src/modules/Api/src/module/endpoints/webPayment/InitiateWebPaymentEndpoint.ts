// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractEndpointDependencies,
  type ICache,
  type IEndpointDefinition,
  type IOcppSender,
  AbstractEndpoint,
  CacheNamespace,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import {
  AttributeEnum,
  EventGroup,
  HttpMethod,
  type OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { IDeviceModelRepository } from '@dal/interfaces/repositories.js';
import type { InitiateWebPaymentRequest } from '@modules/EVDriver/src/module/interface.js';
import { InitiateWebPaymentRequestSchema } from '@modules/EVDriver/src/module/interface.js';
import { TotpUtil } from '@util/index.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

const DEFAULT_LOCK_TIMEOUT_SECONDS = 300;

interface Dependencies extends AbstractEndpointDependencies {
  ocppSender: IOcppSender;
  cache: ICache;
  deviceModelRepository: IDeviceModelRepository;
}

type InitiateWebPaymentRoute = { Body: InitiateWebPaymentRequest };

export class InitiateWebPaymentEndpoint extends AbstractEndpoint<InitiateWebPaymentRoute> {
  static readonly route: IEndpointDefinition = {
    method: HttpMethod.Post,
    path: '/webpayment/initiate',
    bodySchema: InitiateWebPaymentRequestSchema,
  };

  private readonly _ocppSender: IOcppSender;
  private readonly _cache: ICache;
  private readonly _deviceModelRepository: IDeviceModelRepository;

  constructor({ logger, ocppSender, cache, deviceModelRepository }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
    this._cache = cache;
    this._deviceModelRepository = deviceModelRepository;
  }

  async handle(
    request: FastifyRequest<InitiateWebPaymentRoute>,
    reply: FastifyReply,
  ): Promise<unknown> {
    const { identifier, evseId, totp, maxCost, maxTime, maxEnergy } = request.body;
    const tenantId = request.body.tenantId ?? DEFAULT_TENANT_ID;
    const lockTimeout = request.body.timeout ?? DEFAULT_LOCK_TIMEOUT_SECONDS;

    let sharedSecret: string | undefined;
    try {
      const sharedSecretAttrs = await this._deviceModelRepository.readAllByQuerystring(tenantId, {
        tenantId,
        ocppConnectionName: identifier,
        component_name: 'WebPaymentsCtrlr',
        variable_name: 'SharedSecret',
        type: AttributeEnum.Actual,
      });
      sharedSecret = sharedSecretAttrs[0]?.value ?? undefined;
    } catch (error) {
      this._logger.error(
        `Failed to read WebPaymentsCtrlr.SharedSecret for station ${identifier}`,
        error,
      );
      return reply
        .code(503)
        .send({ error: 'Failed to read station configuration. Please try again.' });
    }

    if (!sharedSecret) {
      this._logger.warn(`WebPaymentsCtrlr.SharedSecret not configured for station ${identifier}`);
      return reply.code(503).send({ error: 'Web payment not configured for this station.' });
    }

    if (!TotpUtil.validate(sharedSecret, totp)) {
      this._logger.warn(
        `TOTP validation failed for station ${identifier}, evseId=${evseId}. ` +
          'QR code may be expired or fraudulent.',
      );
      return reply.code(401).send({ error: 'TOTP validation failed. The QR code may be expired.' });
    }

    const limits = { maxCost, maxTime, maxEnergy };
    await this._cache.set(
      `webpayment:${tenantId}:${identifier}:${evseId}`,
      JSON.stringify(limits),
      CacheNamespace.Other,
      lockTimeout,
    );

    await this._notifyStation(tenantId, identifier, evseId, lockTimeout);

    return reply.send({
      success: true,
      stationId: identifier,
      evseId,
      timeout: lockTimeout,
      limits,
    });
  }

  private async _notifyStation(
    tenantId: number,
    ocppConnectionName: string,
    evseId: number,
    lockTimeout: number,
  ): Promise<void> {
    const payload: OCPP2_1.NotifyWebPaymentStartedRequest = { evseId, timeout: lockTimeout };
    try {
      await this._ocppSender.sendCall({
        ocppConnectionName,
        tenantId,
        protocol: OCPPVersion.OCPP2_1,
        action: OCPP_CallAction.NotifyWebPaymentStarted,
        eventGroup: EventGroup.EVDriver,
        payload,
      });
      this._logger.info(
        `NotifyWebPaymentStarted sent to station ${ocppConnectionName}, ` +
          `evseId=${evseId}, timeout=${lockTimeout}s`,
      );
    } catch (error) {
      this._logger.warn(
        `NotifyWebPaymentStarted to station ${ocppConnectionName} failed (non-fatal): ${error}`,
      );
    }
  }
}
