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
   - As of time of writing, two processors exist for OCPP Messages: One to dispatch the message via the
     webhook-dispatcher (for any Charging Station message subscribers), and the other to store the OCPP message in the
     OCPPMessaages database table.

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

# Future features

1. Dead-letter queue processing (that isn't just logging the failed message)
2. Adding prefetch (if needed)
3. Additional message kinds