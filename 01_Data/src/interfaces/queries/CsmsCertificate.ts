// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { QuerySchema } from "@citrineos/base";

export const CsmsCertificateSchema = QuerySchema([
    ["contentType", "string"], ["certificateChain", "string"], ["privateKeys", "string"], ["caCertificateRoots", "string"]], ["contentType", "certificateChain", "privateKeys"]);

export const UpdateCsmsCertificateQuerySchema = QuerySchema([
    ["id", "string"]], ["id"]);

export interface UpdateCsmsCertificateQueryString {
    id: string
}