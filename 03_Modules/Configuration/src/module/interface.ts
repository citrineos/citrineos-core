// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  IMessageConfirmation,
  OCPP2_0_1
} from '@citrineos/base';

/**
 * Interface for the Configuration module.
 */
export interface IConfigurationModuleApi {
  setNetworkProfile(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.SetNetworkProfileRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation>;
  reset(
    identifier: string,
    tenantId: string,
    request: OCPP2_0_1.ResetRequest,
    callbackUrl?: string,
  ): Promise<IMessageConfirmation>;
}
