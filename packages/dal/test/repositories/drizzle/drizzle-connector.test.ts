// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { writableConnectorColumns } from '../../../src/repositories/drizzle/connector.js';

describe('writableConnectorColumns', () => {
  it('preserves tariffId when provided or explicitly cleared with null', () => {
    expect(writableConnectorColumns({ tariffId: 42 })).toEqual({ tariffId: 42 });
    expect(writableConnectorColumns({ tariffId: null })).toEqual({ tariffId: null });
  });

  it('omits tariffId when undefined so partial updates do not clear it', () => {
    expect(writableConnectorColumns({ info: 'ready' })).toEqual({ info: 'ready' });
  });
});
