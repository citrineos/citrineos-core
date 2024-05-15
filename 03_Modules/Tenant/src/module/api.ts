// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { AbstractModuleApi } from "@citrineos/base";
import { TenantModule } from "./module";
import { ITenantModuleApi } from "./interface";

export class TenantApi 
  extends AbstractModuleApi<TenantModule> 
  implements ITenantModuleApi {

}