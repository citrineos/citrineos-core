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
4. Export your handler from `handlers/index.ts` so it's part of `@citrineos/ocpp`'s public API.
5. Add the handler class to your module's handler list in `modules/<Module>/src/register.ts`.
   1. i.e. `CERTIFICATES_HANDLERS` in `modules/Certificates/src/register.ts`.
   2. This is what gets the handler dependency-injected into that module, and what makes the module
      subscribe to its action. Otherwise, nothing catches a handler left out of every list — it compiles, and
      simply never runs — so this is the step to double-check. The reverse is caught: renaming or
      deleting a class that a list references fails the build.

With these changes, there is no longer a config step: adding the class to the module's list is what makes the module
subscribe to that action.

## Excluding an action a module has a handler for

To keep a handler in the codebase but stop a deployment from receiving its action, list the action in
that module's `excludedRequests` or `excludedResponses` in config, e.g.
`config.modules.certificates.excludedRequests`. The handler is still constructed; the module simply
does not subscribe, so nothing is routed to it.

## How do `@AsRequestHandler` and `@AsResponseHandler` work?

The `@AsRequestHandler` and `@AsResponseHandler` decorators build on top of the underlying `asHandlerClass`
to record the protocol, action, and type as reflect-metadata on the class for every protocol passed in.

Each module's registrar declares the handler classes it owns and passes them to `buildHandlers`, which
constructs each one from the module's own container scope (`moduleScope`). `AbstractModule` then reads that
metadata back off each instance twice over: to key its `protocol:action:type` dispatch map, and to derive
the requests and responses it subscribes to, minus anything config excludes.

So a handler declares _what it serves_ once, on itself; its module declares _that it owns it_; and those
two facts alone decide what the module receives.
