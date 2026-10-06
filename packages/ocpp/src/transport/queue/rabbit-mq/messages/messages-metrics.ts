// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Messages-plane metrics: consumption of the `messages` exchange and the processor pipeline.
 *
 * These instruments feed whatever global OpenTelemetry MeterProvider is registered in the process.
 * As in `transport/metrics.ts`, the instruments are module-private and emitted through the
 * exported `record*` helpers so closed-set label values are enforced at every call site.
 */

import { MESSAGES_QUEUES, MessagesEventKind } from '@citrineos/types';
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('citrineos.ocpp');

// --- Label vocabularies ------------------------------------------------------

/** `outcome` on {@link recordMessagesEventProcessed}: how the work-queue delivery was settled. */
export const MessagesEventOutcome = {
  Ack: 'ack',
  Requeue: 'requeue',
  DeadLetter: 'dead_letter',
  Poison: 'poison',
} as const;
export type MessagesEventOutcome = (typeof MessagesEventOutcome)[keyof typeof MessagesEventOutcome];

/** RabbitMQ `x-death` reasons, used only to seed {@link recordMessagesDeadLetterReceived}. */
const DEAD_LETTER_REASONS = ['rejected', 'expired', 'maxlen'] as const;

/** `reason` label value used when a dead-lettered message carries no `x-death` header. */
export const UNKNOWN_DEAD_LETTER_REASON = 'unknown';

// --- Consumption -------------------------------------------------------------

/**
 * Work-queue deliveries settled by this pod, by `kind` and `outcome`
 * (ack | requeue | dead_letter | poison). `kind` is the queue's kind, so poison messages whose
 * body never parsed are still attributed. The canary signal is the dead_letter + poison ratio.
 *
 * Counted where the delivery is acked or rejected, never on the dead-letter queues: every pod
 * drains those, so a count there would credit the failure to whichever pod happened to drain it.
 */
const messagesEventProcessedTotal = meter.createCounter('messages_event_processed_total', {
  description: 'Messages-plane events settled by this consumer, by kind and outcome',
});

/**
 * Time from the event's own `timestamp` to the moment it was consumed, by `kind`. Meaningful once
 * the queue is steady; while a backlog drains it reports the age of the backlog.
 */
const messagesEventLag = meter.createHistogram('messages_event_lag_seconds', {
  description: 'Time from event timestamp to consumption, by kind',
  unit: 's',
});

/** Deliveries currently being handled by this pod. Bounded by the channel prefetch, if any. */
const messagesEventsInFlight = meter.createUpDownCounter('messages_events_in_flight', {
  description: 'Messages-plane events currently being processed',
});

/** Messages arriving on a dead-letter queue, by `dlq` and `x-death` `reason`. For alerting. */
const messagesDeadLetterReceivedTotal = meter.createCounter('messages_dead_letter_received_total', {
  description: 'Messages received on a messages-plane dead-letter queue, by queue and reason',
});

/** A work-queue delivery of `kind` was settled with `outcome`. */
export function recordMessagesEventProcessed(
  kind: MessagesEventKind,
  outcome: MessagesEventOutcome,
): void {
  messagesEventProcessedTotal.add(1, { kind, outcome });
}

/** Records consumption lag (seconds) for an event of `kind`. */
export function recordMessagesEventLag(seconds: number, kind: MessagesEventKind): void {
  messagesEventLag.record(seconds, { kind });
}

/** Adjusts the in-flight gauge by `delta` (+1 on delivery, -1 once settled). */
export function recordMessagesEventsInFlightDelta(delta: number): void {
  messagesEventsInFlight.add(delta);
}

/** A message arrived on dead-letter queue `dlq`, having died for `reason`. */
export function recordMessagesDeadLetterReceived(dlq: string, reason: string): void {
  messagesDeadLetterReceivedTotal.add(1, { dlq, reason });
}

// --- Pipeline ----------------------------------------------------------------

/**
 * Processor throws, by `processor` and `critical`. A non-critical failure (a webhook) is logged
 * and swallowed, so this counter is the only place it surfaces.
 */
const messagesProcessorFailureTotal = meter.createCounter('messages_processor_failure_total', {
  description: 'Messages-plane processor failures, by processor and criticality',
});

/** Time spent in each processor, successful or not, by `processor`. */
const messagesProcessorDuration = meter.createHistogram('messages_processor_duration_seconds', {
  description: 'Time spent in each messages-plane processor',
  unit: 's',
});

/**
 * Persisted CALLRESULT/CALLERROR rows for which `ocpp_correlate_response()` resolved no action.
 * A non-zero rate points at a trigger or schema regression rather than at station behaviour.
 */
const messagesPersistActionUnresolvedTotal = meter.createCounter(
  'messages_persist_action_unresolved_total',
  {
    description: 'Persisted CALLRESULT/CALLERROR rows the DB trigger resolved no action for',
  },
);

/** Processor `processor` threw; `critical` says whether that failed the event. */
export function recordMessagesProcessorFailure(processor: string, critical: boolean): void {
  messagesProcessorFailureTotal.add(1, { processor, critical: String(critical) });
}

/** Records how long (seconds) processor `processor` took for one event. */
export function recordMessagesProcessorDuration(seconds: number, processor: string): void {
  messagesProcessorDuration.record(seconds, { processor });
}

/** A CALLRESULT/CALLERROR row was persisted without a resolved action. */
export function recordMessagesPersistActionUnresolved(): void {
  messagesPersistActionUnresolvedTotal.add(1);
}

// --- Seeding -----------------------------------------------------------------

/**
 * Seeds a zero-valued data point for every closed-set label combination of the consumption
 * counters, plus the in-flight gauge and the unresolved-action counter.
 */
export function initMessagesMetrics(): void {
  for (const kind of Object.values(MessagesEventKind)) {
    for (const outcome of Object.values(MessagesEventOutcome)) {
      messagesEventProcessedTotal.add(0, { kind, outcome });
    }
  }
  for (const { dlq } of MESSAGES_QUEUES) {
    for (const reason of DEAD_LETTER_REASONS) {
      messagesDeadLetterReceivedTotal.add(0, { dlq, reason });
    }
  }
  messagesEventsInFlight.add(0);
  messagesPersistActionUnresolvedTotal.add(0);
}

/** Seeds a zero-valued failure data point for each configured processor. */
export function initMessagesProcessorMetrics(
  processors: ReadonlyArray<{ name: string; critical: boolean }>,
): void {
  for (const { name, critical } of processors) {
    messagesProcessorFailureTotal.add(0, { processor: name, critical: String(critical) });
  }
}
