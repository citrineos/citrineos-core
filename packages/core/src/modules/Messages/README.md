# What is Messages module?

This module is responsible for processing all "business" messages, such as OCPP frame and general connection events. It 
doesn't extend AbstractModule because it acts independent of the other modules, similar to OcppRouter.

# Architecture

    ┌─────────────────────────────────────────────────────────┐
    │  Station ──ws──► OcppRouter ────► MessagesExchangeSink  │
    └──────────────────┬──────────────────────────────────────┘
    │                  │ topic exchange "messages" (durable)
    │                  │ frame.<direction>.<action>
    │                  │ connection.<state>
    │                  ▼
    │        ┌──────────────────────────────────────────┐
    │        │   messages.ocpp         ← frame.#        │
    │        │   messages.connections  ← connection.#   │
    │        │     both durable, each with a .dlq       │
    │        └──────────────────┬───────────────────────┘
    │                           │ one channel + prefetch per queue
    │                           ▼
    │        ┌────────────────────────────────────────────┐
    │        │   MessagesModule → MessagesEventPipeline   │
    │        │    dispatches by kind:                     │
    │        │     1. frame.#                             │
    │        │     2. connections.#                       │
    │        └────────────────────────────────────────────┘
    │
    ├──── CallbackUrlNotifier ──► the API caller's callback URL
    │
    └──── emitMessage() ──► exchange "citrineos" ──► business modules