---
sidebar_position: 4
title: Running OCPI
---

# Running Citrine with OCPI

In this section, we assume have gone through the [Running CORE](getting-started.md) section and were able
to run `citrineos/core`.

## Installation

The setup process for running CORE with OCPI is very similar to running CORE alone.

**1. Clone the `citrineos/ocpi` repository onto your local machine:**

    git clone https://github.com/citrineos/citrineos-ocpi

**2. Navigate to the `citrineos-ocpi/Server` directory:**

    cd citrineos-ocpi/Server

**3. Start the CORE with OCPI with docker-compose:**

    docker compose up -d

Alternatively, you should also be able to run `npm run start-docker-compose`, which will use the
`./Server/docker-compose.yml` configuration to `docker compose up`.

Now along with all of the CORE components, you will also have Citrine OCPI Server [localhost:8085](http://localhost:8085) with Swagger UI docs available at [localhost:8085/docs](http://localhost:8085/docs).

### Configuration

OCPI have very similar structure to CORE, so you would apply configurations changes in the same way. See
[Configuration section](getting-started.md/#configuration) for more info.
