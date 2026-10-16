// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { RoleDefinitions } from '@citrineos/types';

export interface IRoleProvider {
  listRoles(): Promise<RoleDefinitions>;
}
