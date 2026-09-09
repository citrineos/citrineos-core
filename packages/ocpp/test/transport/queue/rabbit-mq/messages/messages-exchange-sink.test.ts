// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { MessagesExchangeSink, type MessagesEventPublisher } from '@/transport/index.js';
import { aConnectionEvent, aFrameEvent } from '@test/providers/messages-event-provider.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('MessagesExchangeSink', () => {
  const { container } = createTestContainer();
  let publish: ReturnType<typeof vi.fn>;
  let sink: MessagesExchangeSink;

  beforeEach(() => {
    publish = vi.fn().mockResolvedValue(true);
    sink = getTestInstance(container, MessagesExchangeSink, {
      messagesEventPublisher: { publish } as unknown as MessagesEventPublisher,
    });
  });

  it('should hand the event to the publisher unchanged', async () => {
    const event = aFrameEvent();

    await sink.record(event);

    expect(publish).toHaveBeenCalledWith(event);
  });

  it('should report delivery when the broker accepted the event', async () => {
    await expect(sink.record(aFrameEvent())).resolves.toEqual({ delivered: true });
  });

  it('should report non-delivery rather than throwing when the broker did not', async () => {
    publish.mockResolvedValue(false);

    await expect(sink.record(aConnectionEvent())).resolves.toEqual({ delivered: false });
  });
});
