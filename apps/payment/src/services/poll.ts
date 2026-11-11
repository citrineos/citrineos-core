// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export interface PollOptions {
  attempts: number;
  intervalMs: number;
}

export const DEFAULT_POLL: PollOptions = { attempts: 20, intervalMs: 500 };

/**
 * Reads until a value turns up. The bus delivers a station's message to this app and to Core at
 * the same time, so what Core writes for it is polled for rather than assumed to exist yet.
 */
export async function pollFor<T>(
  poll: PollOptions,
  read: () => Promise<T | undefined>,
): Promise<T | undefined> {
  for (let attempt = 1; attempt <= poll.attempts; attempt++) {
    const value = await read();
    if (value !== undefined) {
      return value;
    }
    if (attempt < poll.attempts) {
      await new Promise((resolve) => setTimeout(resolve, poll.intervalMs));
    }
  }
  return undefined;
}
