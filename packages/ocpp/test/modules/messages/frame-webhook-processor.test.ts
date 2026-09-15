// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP_CallAction } from '@citrineos/types';
import { FrameWebhookProcessor } from '@modules/messages/processors/frame-webhook-processor.js';
import type { WebhookDispatcher } from '@modules/messages/webhook-dispatcher.js';
import { aFrameEvent } from '@test/providers/messages-event-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('FrameWebhookProcessor', () => {
  const { container } = createTestContainer();
  let dispatchFrame: ReturnType<typeof vi.fn>;
  let processor: FrameWebhookProcessor;

  beforeEach(() => {
    dispatchFrame = vi.fn().mockResolvedValue(undefined);
    processor = getTestInstance(container, FrameWebhookProcessor, {
      webhookDispatcher: { dispatchFrame } as unknown as WebhookDispatcher,
    });
  });

  it('should be best-effort, so a dead subscriber endpoint cannot dead-letter a frame', () => {
    expect(processor.critical).toBe(false);
    expect(processor.name).toBe('frame-webhook');
  });

  it('should hand the frame to the dispatcher', async () => {
    const event = aFrameEvent();

    await processor.process(event, {});

    expect(dispatchFrame).toHaveBeenCalledWith(event, undefined);
  });

  it('should pass on the action persistence resolved, which is the only source for a CallResult', async () => {
    await processor.process(aFrameEvent({ action: undefined }), {
      persistedAction: OCPP_CallAction.BootNotification,
      persistedId: 3,
    });

    expect(dispatchFrame).toHaveBeenCalledWith(expect.anything(), OCPP_CallAction.BootNotification);
  });

  it('should propagate a dispatch failure, leaving the pipeline to decide it is not fatal', async () => {
    dispatchFrame.mockRejectedValue(new Error('endpoint 500'));

    await expect(processor.process(aFrameEvent(), {})).rejects.toThrow('endpoint 500');
  });
});
