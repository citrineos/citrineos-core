// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { IMessageConfirmation, IModule } from '@citrineos/base';
import type { CallAction, OCPPVersion } from '@citrineos/types';

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
  const results = identifier.map((ocppConnectionName) =>
    module.sendCall(
      ocppConnectionName,
      tenantId,
      ocppVersion,
      action,
      request,
      callbackUrl,
      correlationId,
    ),
  );

  return Promise.all(results);
};
