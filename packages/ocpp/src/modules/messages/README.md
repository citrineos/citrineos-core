<!--
SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project

SPDX-License-Identifier: Apache-2.0
-->

# What is Messages module?

This module is responsible for processing all "business" messages, such as OCPP frame and general connection events. It
doesn't extend AbstractModule because it acts independent of the other modules, similar to OcppRouter.

## Why does this module exist?

To offload the responsibility of tracking the "business" messages away from OcppRouter. This way, we can move this logic
out of the "hot path" and expand to process messages more flexibly without adding unnecessary load to the OcppRouter.

# Architecture

## Example: OCPP Message

1. The Charging Station sends an OCPP Message.
2. OcppRouter receives the message and, in addition to propagating the message to the appropriate module/handler, sends
   the frame event to the MessagesExchangeSink.
3. The MessagesExchangeSink publishes (with the help of MessagesEventPublisher) the message to the "messages" RabbitMQ exchange,
   which is then routed to the "frame" queue.
4. The MessagesModule consumes (with the help of MessagesEventConsumer) the message and runs all frame processors against
   the message (with the help of MessagesEventPipeline).
   - As of time of writing, three processors exist for OCPP Messages: one to store the OCPP message in the
     OCPPMessages database table, one to dispatch the message via the webhook-dispatcher (for any Charging Station
     message subscribers), and one to stamp `ChargingStations.latestOcppMessageTimestamp` with the receipt time of
     each inbound frame.

## Example: Websocket Connection

1. The Charging Station connects to CitrineOS.
2. OcppRouter registers the websocket connection and, in addition to setting the charger online, propagates the connection
   event to the MessagesExchangeSink.
3. The MessagesExchangeSink publishes (with the help of MessagesEventPublisher) the message to the "messages" RabbitMQ exchange.
   which is then routed to the "connections" queue.
4. The MessagesModule consumes (with the help of MessagesEventConsumer) the message and runs all connection processors against
   the message (with the help of MessagesEventPipeline).
   - As of time of writing, one process exists for connections: it registers the websocket connection using the webhook-dispatcher.

## Diagram

    ┌───────────────────────────────────────────────────────────────────────┐
    │  Station → OcppRouter → MessagesExchangeSink → MessagesEventPublisher │
    └──────────────────┬────────────────────────────────────────────────────┘
    │                  │ topic exchange "messages" (durable)
    │                  │ frame.<direction>.<action>
    │                  │ connection.<state>
    │                  ▼
    │        ┌──────────────────────────────────────────┐
    │        │   (RabbitMQ exchanges)
    │        │   messages.ocpp         ← frame.#        │
    │        │   messages.connections  ← connection.#   │
    │        │     both durable, each with a .dlq       │
    │        └──────────────────┬───────────────────────┘
    │                           │ one channel per queue
    │                           ▼
    │        ┌────────────────────────────────────────────────────────────────────────┐
    │        │   MessagesModule (via MessagesEventConsumer) → MessagesEventPipeline   │
    │        │      Dispatches by kind (presently frame.# or connection.#)            │
    │        └────────────────────────────────────────────────────────────────────────┘
    │
    ├──── CallbackUrlNotifier ──► the API caller's callback URL
    │
    └──── emitMessage() ──► exchange "citrineos" ──► business modules

# The "messages" exchange

A new "messages" exchange was added to RabbitMQ handle all "business" messages, and presently
holds two queues: one for frame events and one for websocket connections.

# Dead-letter queues

Each work queue names "messages.dlx" as its dead-letter exchange, and each has its own dead-letter
queue: "messages.ocpp.dlq" and "messages.connections.dlq". An event lands there when it is poison
(a non-JSON body, or an envelope the schema rejects) or when a critical processor fails twice — the
first failure is requeued once, the second dead-letters.

MessagesDeadLetterConsumer drains both. For now, it only reports: each arrival is logged at error
level with the whole body, the "x-death" reason, the queue it died on, and the envelope facets it
could still read, and is then acked. Nothing replays a dead-lettered event yet, so the log line is
the only remaining record of it. A proper dead-letter queue process will be implemented in the future.

# The OCPP dead-letter queue

Messages on the OCPP exchange (`messageBroker.amqp.exchange`, "citrineos" by default) that a router
or module gives up on are published to the fanout exchange "citrineos.dlx" and drained from
"citrineos.dlq" by OcppDeadLetterConsumer. Nothing is replayed; each dead letter is counted on
`ocpp_dead_letter_received_total` by reason and action, for alerting, and logged. The first dead
letter of a given reason, action and source in each minute is logged in full; the rest are
summarised in one line when the minute ends.

The reason is carried in `x-citrineos-dead-letter-reason`, along with the source (router, module,
or the sender that would have published it), the queue it was consumed from and the error, when
there was one:

| Reason          | Meaning                                                                                |
| --------------- | -------------------------------------------------------------------------------------- |
| `stale`         | A Call for a station outlived its deadline before the router could send it.            |
| `expired`       | The broker's own `x-death` reason: its TTL ran out on a router's queue.                |
| `poison`        | The body was not JSON.                                                                 |
| `handler_error` | Handling it threw. Failures are not retried.                                           |
| `unroutable`    | Re-emitted for a station no router held, and none took it in time (see below).         |
| `overflow`      | More than `ocpp.maxPendingCallsPerStation` Calls were already waiting for the station. |
| `shutdown`      | A router shut down while holding it.                                                   |

## When a Call goes stale

A Call the CSMS sends is dropped once it is `timeouts.staleCallMaxAgeSeconds` old (40 by default).
0 never drops it. A Call's own `context.staleAfterSeconds`, which the message API takes as the
`staleAfterSeconds` query parameter, takes precedence either way, and 0 there never drops that
Call. A CallResult or CallError the CSMS sends is always dropped after `maxCallLengthSeconds`: by
then the station has stopped waiting for it.

Each is published with an `expiration` of the time it has left, so one that goes stale on a
router's queue is expired by the broker. One with no time left is never published at all, since a consumer that is ready can receive a
message before the broker expires it. The sender dead-letters it as `stale` instead; a router
re-emitting it does the same, or dead-letters it as `unroutable` if it went stale while waiting for
a router to take it.

## Messages the router re-emits

A router that receives a message for a station whose websocket is not on it re-publishes the
message for whichever router holds the station. While no router does, the broker hands it back,
and it is retried with backoff until it goes stale or `messageBroker.amqp.reemitMaxRetrySeconds`
(300 by default) have passed since it was first re-emitted, whichever is sooner. It is then
dead-lettered as `unroutable`. That limit is what bounds a Call that never goes stale.

These retries, and the Calls a router holds while a station has one outstanding, live in the
router's memory: a router that crashes loses them. Each is logged at info when it starts waiting,
with its correlationId, so what was lost can be found by the absence of a later sent frame or dead
letter.

## Bounds

The queue is capped at `messageBroker.amqp.deadLetterQueue.maxLength` messages (100,000) and
`maxLengthBytes` (512 MB), whichever is reached first. Past either, the oldest dead letter is
dropped without a log; `ocpp_message_dead_lettered_total{outcome="published"}`, counted at the pod
that produced each dead letter, still includes it, so the difference from
`ocpp_dead_letter_received_total` is what was dropped. The bounds are queue arguments: changing them means deleting the queue first. An
operator policy can lower them in place.

# Future features

1. Dead-letter queue processing (that isn't just logging the failed message), including parking
   Calls that never go stale until their station connects, rather than dead-lettering them after
   `reemitMaxRetrySeconds`
2. Additional message kinds
