// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { QuerySchema } from "@citrineos/base";

export const CsmsCertificateSchema = QuerySchema([
    ["certificateChain", "string"], ["privateKey", "string"], ["caCertificate", "string"]], ["certificateChain", "privateKey"]);

export const UpdateCsmsCertificateQuerySchema = QuerySchema([
    ["id", "string"]], ["id"]);

export interface UpdateCsmsCertificateQueryString {
    id: string
}