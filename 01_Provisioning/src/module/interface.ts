/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Copyright (c) 2023 S44, LLC
 */

import { GetBaseReportRequest, GetVariablesRequest, IMessageConfirmation, ResetRequest, SetNetworkProfileRequest, SetVariablesRequest } from "@citrineos/base";

/**
 * Interface for the provisioning module.
 */
export interface IProvisioningModuleApi {
    getBaseReport(identifier: string, tenantId: string, request: GetBaseReportRequest, callbackUrl?: string): Promise<IMessageConfirmation>;
    setVariables(identifier: string, tenantId: string, request: SetVariablesRequest, callbackUrl?: string): Promise<IMessageConfirmation>;
    getVariables(identifier: string, tenantId: string, request: GetVariablesRequest, callbackUrl?: string): Promise<IMessageConfirmation>;
    setNetworkProfile(identifier: string, tenantId: string, request: SetNetworkProfileRequest, callbackUrl?: string): Promise<IMessageConfirmation>;
    reset(identifier: string, tenantId: string, request: ResetRequest, callbackUrl?: string): Promise<IMessageConfirmation>;
}