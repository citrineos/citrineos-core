// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { asClass, asFunction, type AwilixContainer } from 'awilix';
import {
  type AbstractHandler,
  buildHandlers,
  type HandlerClass,
  type HandlerResolverCradle,
} from '@citrineos/base';
import {
  BootNotificationRequestOcpp16Handler,
  BootNotificationRequestOcpp2Handler,
  ChangeAvailabilityResponseOcpp16Handler,
  ChangeAvailabilityResponseOcpp2Handler,
  ChangeConfigurationResponseOcpp16Handler,
  ClearDisplayMessageResponseOcpp2Handler,
  DataTransferRequestOcpp16Handler,
  DataTransferRequestOcpp2Handler,
  DataTransferResponseOcpp16Handler,
  DataTransferResponseOcpp2Handler,
  FirmwareStatusNotificationRequestOcpp16Handler,
  FirmwareStatusNotificationRequestOcpp2Handler,
  GetConfigurationResponseOcpp16Handler,
  GetDisplayMessagesResponseOcpp2Handler,
  HeartbeatRequestOcpp16Handler,
  HeartbeatRequestOcpp2Handler,
  NotifyDisplayMessagesRequestOcpp2Handler,
  PublishFirmwareResponseOcpp2Handler,
  ResetResponseOcpp16Handler,
  ResetResponseOcpp2Handler,
  SetDisplayMessageResponseOcpp2Handler,
  SetNetworkProfileResponseOcpp2Handler,
  TriggerMessageResponseOcpp16Handler,
  TriggerMessageResponseOcpp2Handler,
  UnpublishFirmwareResponseOcpp2Handler,
  UpdateFirmwareResponseOcpp2Handler,
} from '@handlers/index.js';
import { BootNotificationService } from './module/BootNotificationService.js';
import { DeviceModelService } from './module/DeviceModelService.js';

const CONFIGURATION_HANDLERS = [
  BootNotificationRequestOcpp16Handler,
  BootNotificationRequestOcpp2Handler,
  DataTransferRequestOcpp16Handler,
  DataTransferRequestOcpp2Handler,
  FirmwareStatusNotificationRequestOcpp16Handler,
  FirmwareStatusNotificationRequestOcpp2Handler,
  HeartbeatRequestOcpp16Handler,
  HeartbeatRequestOcpp2Handler,
  NotifyDisplayMessagesRequestOcpp2Handler,
  ChangeAvailabilityResponseOcpp16Handler,
  ChangeAvailabilityResponseOcpp2Handler,
  ChangeConfigurationResponseOcpp16Handler,
  ClearDisplayMessageResponseOcpp2Handler,
  DataTransferResponseOcpp16Handler,
  DataTransferResponseOcpp2Handler,
  GetConfigurationResponseOcpp16Handler,
  GetDisplayMessagesResponseOcpp2Handler,
  PublishFirmwareResponseOcpp2Handler,
  ResetResponseOcpp16Handler,
  ResetResponseOcpp2Handler,
  SetDisplayMessageResponseOcpp2Handler,
  SetNetworkProfileResponseOcpp2Handler,
  TriggerMessageResponseOcpp16Handler,
  TriggerMessageResponseOcpp2Handler,
  UnpublishFirmwareResponseOcpp2Handler,
  UpdateFirmwareResponseOcpp2Handler,
] satisfies ReadonlyArray<HandlerClass>;

export function registerConfigurationServices(container: AwilixContainer): void {
  container.register({
    configurationDeviceModelService: asClass(DeviceModelService).scoped(),
    // BootNotificationService takes the narrowed module config, not the full `config` token.
    bootNotificationService: asFunction(
      ({ bootRepository, cache, config, logger }) =>
        new BootNotificationService({
          bootRepository,
          cache,
          config: config.ocpp,
          logger,
        }),
    ).scoped(),
    configurationHandlers: asFunction((cradle: HandlerResolverCradle): AbstractHandler[] =>
      buildHandlers(cradle.moduleScope, CONFIGURATION_HANDLERS),
    ).scoped(),
  });
}
