// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  ConnectorDto,
  ConnectorErrorCodeEnumType,
  ConnectorStatusEnumType,
} from '@citrineos/types';

export class ConnectorClass implements Partial<ConnectorDto> {
  id?: number;
  connectorId?: number | null;
  status?: ConnectorStatusEnumType | null;
  errorCode?: ConnectorErrorCodeEnumType | null;
}
