// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type { ConnectorStatus } from '../../src/components/status-badge';
import { StatusBadge } from '../../src/components/status-badge';
import { render } from '../render';

describe('StatusBadge', () => {
  it.each<[ConnectorStatus, string]>([
    ['Available', 'bg-green-100'],
    ['Charging', 'bg-blue-100'],
    ['Occupied', 'bg-violet-100'],
    ['SuspendedEV', 'bg-violet-100'],
    ['Reserved', 'bg-cyan-100'],
    ['Faulted', 'bg-red-100'],
    ['Unavailable', 'bg-gray-100'],
    ['Unknown', 'bg-gray-100'],
  ])('shows %s in the operator UI’s colour', async (status, colour) => {
    const container = await render(<StatusBadge status={status} />);
    const badge = container.querySelector('span');

    expect(badge?.textContent).toBe(status);
    expect(badge?.className).toContain(colour);
  });
});
