// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { gql } from 'graphql-tag';
import { INSTALLED_CERTIFICATE_FIELDS } from '@lib/queries/fields/installed.certificate.fields';

export const INSTALLED_CERTIFICATE_LIST_QUERY = gql`
  query InstalledCertificateList(
    $offset: Int!
    $limit: Int!
    $order_by: [InstalledCertificates_order_by!]
    $where: InstalledCertificates_bool_exp
  ) {
    InstalledCertificates(offset: $offset, limit: $limit, order_by: $order_by, where: $where) {
      ${INSTALLED_CERTIFICATE_FIELDS}
    }
    InstalledCertificates_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const INSTALLED_CERTIFICATE_GET_QUERY = gql`
  query GetInstalledCertificateById($id: Int!) {
    InstalledCertificates_by_pk(id: $id) {
      ${INSTALLED_CERTIFICATE_FIELDS}
    }
  }
`;
