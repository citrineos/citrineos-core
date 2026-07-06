// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OcpiHttpHeader } from '../OcpiHttpHeader.js';
import { OcpiHeaders } from '../../model/OcpiHeaders.js';
import { createParamDecorator } from 'routing-controllers';

export function FunctionalEndpointParams() {
  return createParamDecorator({
    required: true,
    value: (action: any) => {
      const fromCountryCode =
        action.request.headers[OcpiHttpHeader.OcpiFromCountryCode.toLocaleLowerCase()];
      const fromPartyId =
        action.request.headers[OcpiHttpHeader.OcpiFromPartyId.toLocaleLowerCase()];
      const toCountryCode =
        action.request.headers[OcpiHttpHeader.OcpiToCountryCode.toLocaleLowerCase()];
      const toPartyId = action.request.headers[OcpiHttpHeader.OcpiToPartyId.toLocaleLowerCase()];

      const headers = new OcpiHeaders(fromCountryCode, fromPartyId, toCountryCode, toPartyId);
      return headers;
    },
  });
}
