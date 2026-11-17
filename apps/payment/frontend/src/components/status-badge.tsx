// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { Connector } from '../api';

export type ConnectorStatus = NonNullable<Connector['status']>;

const Tone = {
  Green: 'border-green-200 bg-green-100 text-green-800',
  Blue: 'border-blue-200 bg-blue-100 text-blue-800',
  Violet: 'border-violet-200 bg-violet-100 text-violet-800',
  Cyan: 'border-cyan-200 bg-cyan-100 text-cyan-800',
  Red: 'border-red-200 bg-red-100 text-red-800',
  Gray: 'border-gray-200 bg-gray-100 text-gray-800',
} as const;

/**
 * The colours the operator UI gives the same statuses (its charging station status tag): free is
 * green, charging blue, a session that is starting, paused or ending violet, reserved cyan, faulted
 * red, and out of service or unknown gray. Occupied is violet: the operator UI shows it blue only
 * while the car is drawing power, which this page does not know.
 */
const TONES: Record<ConnectorStatus, string> = {
  Available: Tone.Green,
  Charging: Tone.Blue,
  Occupied: Tone.Violet,
  Preparing: Tone.Violet,
  SuspendedEV: Tone.Violet,
  SuspendedEVSE: Tone.Violet,
  Finishing: Tone.Violet,
  Reserved: Tone.Cyan,
  Faulted: Tone.Red,
  Unavailable: Tone.Gray,
  Unknown: Tone.Gray,
};

/** A connector's status as a coloured badge, as the operator UI shows it. */
export function StatusBadge({ status }: { status: ConnectorStatus }) {
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[status]}`}
    >
      {status}
    </span>
  );
}
