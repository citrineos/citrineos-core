// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// Internal types for Authorization models to break circular dependencies

export interface ITenant {
  id: number;
  name: string;
}

export interface ITenantPartner {
  id: number;
  name: string;
}
