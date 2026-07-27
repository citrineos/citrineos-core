# Handlers

Each class-based handler in `handlers` should be responsible for one message within a set of OCPP protocols.
The handlers are named based on their:

1. Call Action (i.e. Heartbeat, StatusNotification)
2. Message "type" (either Request or Response)
3. Protocol (i.e. OCPP 2.x or 1.6)

For example, if you have handlers for Heartbeat requests and responses for OCPP 1.6 and 2.x protocols, your files would
look like this:

      handlers/
      ├─ requests/
      │  ├─ 1.6/
      │  │  ├─ HeartbeatRequestOcpp16Handler.ts
      │  ├─ 2/
      │  │  ├─ HeartbeatRequestOcpp2Handler.ts
      ├─ responses/
      │  ├─ 1.6/
      │  │  ├─ HeartbeatResponseOcpp16Handler.ts
      │  ├─ 2/
      │  │  ├─ HeartbeatResponseOcpp2Handler.ts
   

All handlers are exported in `handlers/index.ts`.

## Registering handlers to modules

To register a handler to a particular module:

1. Create your handler class under `requests/<version>/` or `responses/<version>/`, named
   `<Action><Request|Response>Ocpp<version>Handler.ts`.
2. Extend `AbstractHandler`.
3. Decorate your handler with either `@AsRequestHandler` or `@AsResponseHandler` (based on whether the handler processes
a request or response).
   1. Ensure that the correct protocols and call action are passed as arguments to the decorator.
4. Export your handler from `handlers/index.ts` so it's part of `@citrineos/core`'s public API.
5. Register the handler in `apps/ocpp-server/src/container.ts`'s `registerHandlers` function.
   1. This allows the handler to be dependency-injected into the relevant modules.
6. Ensure your module's config includes the request/response that matches with the handler.
   1. i.e. `config.modules.certificates.requests = [CallAction.YOUR_ACTION]`

## How do `@AsRequestHandler` and `@AsResponseHandler` work?

The `@AsRequestHandler` and `@AsResponseHandler` decorators build on top of the underlying `asHandlerClass`
to record the protocol, action, and type as reflect-metadata on the class for every protocol passed in. Then it
pushes the class into the module-level `HANDLER_CLASS_REGISTRY` array so that when the module's config is resolved by
`getHandlersByConfig`, it knows which handlers to inject.
