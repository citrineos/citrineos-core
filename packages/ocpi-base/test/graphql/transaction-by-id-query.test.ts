// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { GET_TRANSACTION_BY_ID_QUERY } from '../../src/graphql/queries/transaction-queries.js';

describe('GET_TRANSACTION_BY_ID_QUERY', () => {
  it('does not select through Transactions_by_pk, which needs the whole (id, createdAt) key', () => {
    expect(GET_TRANSACTION_BY_ID_QUERY).not.toMatch(/Transactions_by_pk/);
  });

  it('selects at most one transaction by id', () => {
    expect(GET_TRANSACTION_BY_ID_QUERY).toMatch(
      /Transactions\s*\(\s*where:\s*\{\s*id:\s*\{\s*_eq:\s*\$id\s*\}\s*\}\s*,\s*limit:\s*1\s*\)/,
    );
  });
});
