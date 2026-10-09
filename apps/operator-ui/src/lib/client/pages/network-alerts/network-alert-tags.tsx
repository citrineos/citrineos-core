// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import {
  type NetworkAlertSeverity,
  NetworkAlertSeveritySchema,
  type NetworkAlertStatus,
  NetworkAlertStatusSchema,
} from '@citrineos/types';
import GenericTag from '@lib/client/components/tag';

export const NetworkAlertSeverityTag = ({ severity }: { severity: NetworkAlertSeverity }) => (
  <GenericTag
    colorMap={{
      Critical: 'red',
      Warning: 'orange',
      Info: 'blue',
    }}
    enumType={NetworkAlertSeveritySchema.enum}
    enumValue={severity}
  />
);

export const NetworkAlertStatusTag = ({ status }: { status: NetworkAlertStatus }) => (
  <GenericTag
    colorMap={{
      Active: 'red',
      Acknowledged: 'yellow',
      Resolved: 'green',
    }}
    enumType={NetworkAlertStatusSchema.enum}
    enumValue={status}
  />
);
