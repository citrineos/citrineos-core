// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod';
import { ModuleId } from './ModuleId.js';
import type { ClientCredentialsRole } from './ClientCredentialsRole.js';
import { ClientCredentialsRoleSchema, toCredentialsRoleDTO } from './ClientCredentialsRole.js';
import type { ClientVersion } from './ClientVersion.js';
import { ClientVersionSchema } from './ClientVersion.js';
import type { ServerVersion } from './ServerVersion.js';
import { ServerVersionSchema } from './ServerVersion.js';
import type { Endpoint } from './Endpoint.js';
import type { CredentialsDTO } from './DTO/CredentialsDTO.js';

export const ClientInformationSchema = z.object({
  clientToken: z.string().min(1),
  serverToken: z.string().min(1),
  registered: z.boolean(),

  // Excluded from validation; used internally
  clientCredentialsRoles: z.array(ClientCredentialsRoleSchema),
  clientVersionDetails: z.array(ClientVersionSchema),
  serverVersionDetails: z.array(ServerVersionSchema),
  cpoTenantId: z.number(),
});

export type ClientInformation = z.infer<typeof ClientInformationSchema>;

export const buildClientInformation = (
  clientToken: string,
  serverToken: string,
  registered: boolean,
  clientCredentialsRoles: ClientCredentialsRole,
  clientVersionDetails: ClientVersion,
  serverVersionDetails: ServerVersion,
): ClientInformation =>
  ({
    clientToken,
    serverToken,
    registered,
    clientCredentialsRoles,
    clientVersionDetails,
    serverVersionDetails,
    cpoTenantId: 0,
  }) as any;

export const getClientVersionDetailsByModuleId = (
  clientInformation: ClientInformation,
  moduleId: ModuleId,
): Endpoint | undefined => {
  if (
    !clientInformation ||
    !clientInformation.clientVersionDetails[0] ||
    !clientInformation.clientVersionDetails[0].endpoints
  ) {
    return undefined;
  }
  return clientInformation.clientVersionDetails[0].endpoints.find(
    (endpoint: Endpoint) => endpoint.identifier === moduleId,
  );
};

export const toCredentialsDTO = (clientInformation: ClientInformation): CredentialsDTO => {
  const credentialsEndpoint = getClientVersionDetailsByModuleId(
    clientInformation,
    ModuleId.Credentials,
  );

  return {
    token: clientInformation.serverToken,
    url: credentialsEndpoint?.url ?? '',
    roles: clientInformation.clientCredentialsRoles.map(toCredentialsRoleDTO),
  };
};
