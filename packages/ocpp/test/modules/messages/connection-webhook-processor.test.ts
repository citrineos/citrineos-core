// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { ConnectionEventState } from '@citrineos/types';
import { ConnectionWebhookProcessor } from '@modules/messages/processors/connection-webhook-processor.js';
import type { WebhookDispatcher } from '@modules/messages/webhook-dispatcher.js';
import { aConnectionEvent } from '@test/providers/messages-event-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ConnectionWebhookProcessor', () => {
  const { container } = createTestContainer();
  let register: ReturnType<typeof vi.fn>;
  let deregister: ReturnType<typeof vi.fn>;
  let processor: ConnectionWebhookProcessor;

  beforeEach(() => {
    register = vi.fn().mockResolvedValue(undefined);
    deregister = vi.fn().mockResolvedValue(undefined);
    processor = getTestInstance(container, ConnectionWebhookProcessor, {
      webhookDispatcher: { register, deregister } as unknown as WebhookDispatcher,
    });
  });

  it('should be best-effort, so a dead subscriber endpoint cannot dead-letter a connect', () => {
    expect(processor.critical).toBe(false);
    expect(processor.name).toBe('connection-webhook');
  });

  it('should register the station on connect, which is what loads its subscriptions', async () => {
    await processor.process(aConnectionEvent({ tenantId: 3, ocppConnectionName: 'CS009' }), {});

    expect(register).toHaveBeenCalledWith(3, 'CS009');
    expect(deregister).not.toHaveBeenCalled();
  });

  it('should deregister the station on close, releasing its callbacks', async () => {
    await processor.process(
      aConnectionEvent({
        state: ConnectionEventState.Closed,
        tenantId: 3,
        ocppConnectionName: 'CS009',
      }),
      {},
    );

    expect(deregister).toHaveBeenCalledWith(3, 'CS009');
    expect(register).not.toHaveBeenCalled();
  });

  it('should propagate a failure, leaving the pipeline to decide it is not fatal', async () => {
    register.mockRejectedValue(new Error('subscription table locked'));

    await expect(processor.process(aConnectionEvent(), {})).rejects.toThrow(
      'subscription table locked',
    );
  });
});
