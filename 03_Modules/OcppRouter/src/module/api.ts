// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  AbstractModuleApi,
  AsDataEndpoint,
  BadRequestError,
  CallAction,
  HttpMethod,
  Namespace,
} from '@citrineos/base';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { ILogObj, Logger } from 'tslog';
import { IAdminApi } from './interface';
import { MessageRouterImpl } from './router';
import {
  ChargingStationKeyQuerySchema,
  ChargingStationKeyQuerystring,
  CreateSubscriptionSchema,
  KeyValueQuerystring,
  KeyValueQuerystringSchema,
  ModelKeyQuerystring,
  ModelKeyQuerystringSchema,
  Subscription,
  UserPreferences,
} from '@citrineos/data';

/**
 * Admin API for the OcppRouter.
 */
export class AdminApi
  extends AbstractModuleApi<MessageRouterImpl>
  implements IAdminApi
{
  /**
   * Constructs a new instance of the class.
   *
   * @param {MessageRouterImpl} ocppRouter - The OcppRouter module.
   * @param {FastifyInstance} server - The Fastify server instance.
   * @param {Logger<ILogObj>} [logger] - The logger instance.
   */
  constructor(
    ocppRouter: MessageRouterImpl,
    server: FastifyInstance,
    logger?: Logger<ILogObj>,
  ) {
    super(ocppRouter, server, logger);
  }

  /**
   * Data endpoints
   */

  // N.B.: When adding subscriptions, chargers may be connected to a different instance of Citrine.
  // If this is the case, new subscriptions will not take effect until the charger reconnects.
  /**
   * Creates a {@link Subscription}.
   * Will always create a new entity and return its id.
   *
   * @param {FastifyRequest<{ Body: Subscription }>} request - The request object, containing the body which is parsed as a {@link Subscription}.
   * @return {Promise<number>} The id of the created subscription.
   */
  @AsDataEndpoint(
    Namespace.Subscription,
    HttpMethod.Post,
    undefined,
    CreateSubscriptionSchema,
  )
  async postSubscription(
    request: FastifyRequest<{ Body: Subscription }>,
  ): Promise<number> {
    if (
      !request.body.onClose &&
      !request.body.onConnect &&
      !request.body.onMessage &&
      !request.body.sentMessage
    ) {
      throw new BadRequestError(
        'Must specify at least one of onConnect, onClose, onMessage, sentMessage to true.',
      );
    }
    return this._module.subscriptionRepository
      .create(request.body as Subscription)
      .then((subscription) => subscription?.id);
  }

  @AsDataEndpoint(
    Namespace.Subscription,
    HttpMethod.Get,
    ChargingStationKeyQuerySchema,
  )
  async getSubscriptionsByChargingStation(
    request: FastifyRequest<{ Querystring: ChargingStationKeyQuerystring }>,
  ): Promise<Subscription[]> {
    return this._module.subscriptionRepository.readAllByStationId(
      request.query.stationId,
    );
  }

  @AsDataEndpoint(
    Namespace.Subscription,
    HttpMethod.Delete,
    ModelKeyQuerystringSchema,
  )
  async deleteSubscriptionById(
    request: FastifyRequest<{ Querystring: ModelKeyQuerystring }>,
  ): Promise<boolean> {
    return this._module.subscriptionRepository
      .deleteByKey(request.query.id.toString())
      .then(() => true);
  }

  @AsDataEndpoint(
    Namespace.UserPreferences,
    HttpMethod.Put,
    KeyValueQuerystringSchema,
  )
  async putUserPreference(
    request: FastifyRequest<{ Querystring: KeyValueQuerystring }>,
  ): Promise<boolean> {
    const preferences = await UserPreferences.findByPk(request.query.key)
    if (!preferences) {
      return !!(await UserPreferences.create({
        key: request.query.key,
        value: request.query.value,
      }));
    } else {
      preferences.set('value', request.query.value);
      return !!(await preferences.save());
    }
  }

  @AsDataEndpoint(
    Namespace.UserPreferences,
    HttpMethod.Get,
    KeyValueQuerystringSchema,
  )
  async getUserPreference(
    request: FastifyRequest<{ Querystring: KeyValueQuerystring }>,
  ): Promise<string | undefined> {
    return (await UserPreferences.findByPk(request.query.key))?.value;
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link CallAction} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link CallAction}.
   * @return {string} - The generated URL path.
   */
  protected _toMessagePath(input: CallAction): string {
    const endpointPrefix = '/ocpprouter';
    return super._toMessagePath(input, endpointPrefix);
  }

  /**
   * Overrides superclass method to generate the URL path based on the input {@link Namespace} and the module's endpoint prefix configuration.
   *
   * @param {CallAction} input - The input {@link Namespace}.
   * @return {string} - The generated URL path.
   */
  protected _toDataPath(input: Namespace): string {
    const endpointPrefix = '/ocpprouter';
    return super._toDataPath(input, endpointPrefix);
  }
}
