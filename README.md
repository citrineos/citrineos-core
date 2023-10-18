# CitrineOS Core

This is the main part of CitrineOS containing the actual charging station management logic, OCPP message routing and all modules.

All documentation and the issue tracking can be found in our main repository here: https://github.com/citrineos/citrineos.

## Overview

CitrineOS is developed in TypeScript and runs on `NodeJS`.

The system features:

- Dynamic OCPP 2.0.1 message schema validation, prior to transmission using `AJV`
- Generated OpenAPIv3 specification for easy developer access
- Configurable logical modules with decorators
  - `@AsHandler` to handle incoming OCPP 2.0.1 messages
  - `@AsMessageEndpoint` to expose functions allowing to send messages to charging stations
  - `@AsDataEndpoint` to expose CRUD access to entities defined in `10_Data`
- Utilities to connect and extend various message broker and cache mechanisms
  - Currently supported brokers are `RabbitMQ` and Google Cloud `PubSub`
  - Currently supported caches are `In Memory` and `Redis`

For more information see the [README](50_Server/README.md) in [50_Server](50_Server).

## Build & Install:

To install and run CitrineOS, follow the steps outlined in the [Getting Started Guide](50_Server/README.md).

## Licensing

CitrineOS and its subprojects are licensed under the Apache License, Version 2.0. See LICENSE for the full license text.