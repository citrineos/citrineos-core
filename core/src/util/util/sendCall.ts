// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { CallAction, IMessageConfirmation, IModule, OCPPVersion } from '@citrineos/base';

/** Utility function to package and send a collection of calls using the provided delegate and associated parameters. */
export const packageGroupCall = (
  module: IModule,
  identifier: string[],
  tenantId: number,
  ocppVersion: OCPPVersion,
  action: CallAction,
  request: any,
  callbackUrl?: string,
  correlationId?: string,
): Promise<IMessageConfirmation[]> => {
  const results = identifier.map((stationId) =>
    module.sendCall(stationId, tenantId, ocppVersion, action, request, callbackUrl, correlationId),
  );

  return Promise.all(results);
};
