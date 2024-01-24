// Copyright (c) 2023 S44, LLC
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { RegistrationStatusEnumType, StatusInfoType } from "../ocpp/model";

export interface BootConfig {
    /**
     *  Also declared in SystemConfig. If absent, SystemConfig value is used.
     */
    heartbeatInterval?: number;
    /**
     * Also declared in SystemConfig. If absent, SystemConfig value is used.
     */
    bootRetryInterval?: number;
    status: RegistrationStatusEnumType;
    statusInfo?: StatusInfoType;
    /**
     * Also declared in SystemConfig. If absent, SystemConfig value is used.
     */
    getBaseReportOnPending?: boolean;
    /**
     * Ids of variable attributes to be sent in SetVariablesRequest on pending boot 
     */
    pendingBootSetVariableIds?: number[];
    /**
     * Also declared in SystemConfig. If absent, SystemConfig value is used.
     */
    bootWithRejectedVariables?: boolean;
}