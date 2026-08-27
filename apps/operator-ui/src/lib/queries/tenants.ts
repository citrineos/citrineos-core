// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import gql from 'graphql-tag';
import { TENANT_FIELDS } from '@lib/queries/fields/tenant.fields';

export const TENANT_DETAIL_QUERY = gql`
  query Tenant($id: Int!) {
    Tenants_by_pk(id: $id) {
      ${TENANT_FIELDS}
    }
  }
`;
