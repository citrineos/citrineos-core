---
title: Configuration
---

# Configuring CitrineOS

## Introduction

### Purpose

CitrineOS uses a configuration object, defined in the code as SystemConfig, to define its behavior. This document describes the structure of this object, how to access and modify it, and the meaning of each key-value pair.

### Scope

The configuration object controls the host and port of all servers in the application as well as optional OCPP features and certain values which can be different from network to network (heartbeat interval, message timeout, etc). Where specific technologies can fill a role in CitrineOS, such as RabbitMQ for the message broker, the configuration object contains the information needed for those technologies.

### Audience

This is a low-level document for engineers interested in learning more about how to use CitrineOS.

## Configuration Overview

### Configuration Management

By default, CitrineOS uses a typescript file to store system configuration, such as the files in [Server/src/config](https://github.com/citrineos/citrineos-core/tree/main/Server/src/config).

Environment variables can also be used. They will override the fields in the typescript file when the application starts up. Prefix the variables with 'CITRINEOS', then separate each component of the path to the variable in camel case. Example: CITRINEOS_DATA_SEQUELIZE_USERNAME will override systemConfig.data.sequelize.username with its value.

Each module also supports GET and PUT for systemConfig in order to change it while CitrineOS is running. Not all values currently support being changed after application start-up. For example, adding a websocket server to the list after start-up does not currently create a new websocket server.

---

# System Configuration

- Env: The environment setting (e.g., development, production).
- Log Level: The verbosity level of the logging.
- Max Call Length Seconds: Maximum duration in seconds for a call.
- Max Caching Seconds: Maximum duration in seconds for caching data.

## Central System

- Host: The hostname for the central system.
- Port: The port number for the central system.

## Modules

### Certificates

- Endpoint Prefix: The URL prefix for certificate endpoints.
- Host: The host where the certificate services are running.
- Port: The port number for accessing certificate services.

### Configuration

- Heartbeat Interval: The interval in seconds for sending heartbeat messages.
- Boot Retry Interval: Time interval in seconds before retrying a failed boot process.
- Unknown Charger Status: Default status for chargers not recognized by the system.
- Get Base Report On Pending: Boolean flag to get a base report if the status is pending.
- Boot With Rejected Variables: Boolean flag to attempt booting with rejected variables.
- Auto Accept: Automatically accept configurations if this is set.
- Endpoint Prefix: The endpoint URL prefix for configuration modules.
- Host: Hostname for the configuration service.
- Port: Port number for the configuration service.

### EVDriver

- Endpoint Prefix: The endpoint prefix for EV driver communications.
- Host: The host where the EV driver module is running.
- Port: The port for EV driver communications.

### Monitoring

- Endpoint Prefix: The endpoint prefix for monitoring services.
- Host: The hostname for the monitoring service.
- Port: The port number for monitoring services.

### Reporting

- Endpoint Prefix: The endpoint prefix used for reporting services.
- Host: The hostname for the reporting service.
- Port: The port number for reporting services.

### SmartCharging

- Endpoint Prefix: The endpoint prefix for smart charging services.
- Host: The hostname for smart charging services.
- Port: The port number for smart charging services.

### Transactions

- Endpoint Prefix: The endpoint prefix for transaction services.
- Host: The hostname for transaction services.
- Port: The port number for transaction services.
- Cost Updated Interval: The interval in seconds for updating the cost information.
- Send Cost Updated On Meter Value: Whether to send cost updates with meter readings.

## Data

### Sequelize

- Host: The hostname for the Sequelize database.
- Port: The port number for the Sequelize database.
- Database: The name of the database used.
- Dialect: The type of SQL dialect used (e.g., PostgreSQL, MySQL).
- Username: The username of the account CitrineOS will use to access the database.
- Password: The password of the account CitrineOS will use to access the database.
- Storage: The storage option for Sequelize.
- Sync: Whether to synchronize the database schema automatically.

## Util

### Cache

- Memory: Whether in-memory caching is used.

#### Redis

- Host: The hostname for the Redis server.
- Port: The port number for the Redis server.

### Message Broker

#### Pubsub

- Topic Prefix: The prefix for topics in Pub/Sub messaging.
- Topic Name: The name of the topic that CitrineOS will use.
- Service Path: Path of the Google Pub/Sub instance.

#### Kafka

- Topic Prefix: The prefix for topics.
- Topic Name: The name of the topic that CitrineOS will use.
- Brokers: A list of Kafka brokers.
- SASL:
  - Mechanism: The SASL mechanism used for authentication.
  - Username: The username for SASL authentication.
  - Password: The password for SASL authentication.

#### AMQP

- URL: The URL for accessing AMQP services.
- Exchange: The exchange used in AMQP messaging.

### Swagger

- Path: The URL path for accessing Swagger documentation.
- Logo Path: The path to the logo used in Swagger documentation.
- Expose Data: Whether to expose data in Swagger documentation.
- Expose Message: Whether to expose messaging in Swagger documentation.

### Network Connection

#### Websocket Servers

- Id: Unique identifier for the WebSocket server.
- Host: The hostname for the WebSocket server.
- Port: The port number for the WebSocket server.
- Ping Interval: The interval in seconds between pings to keep the connection alive.
- Protocol: The communication protocol used.
- Security Profile: The security profile level.
- Allow Unknown Charging Stations: Whether to allow connections from unknown charging stations.
- Tls Key File Path: File path to the public key used for tls.
- Tls Certificate Chain File Path: File path to the server certificate chain for tls.
- mTls Certificate Authority Key File Path: File path to the CA public key for mtls.
- Root CA Certificate File Path: File path to the CA root certificate for mtls.

### Certificate Authority

#### V2G CA

- Name: The name of the V2G certificate authority.

##### Hubject

- Base URL: The base URL for the Hubject V2G services.
- Token URL: The URL for obtaining a token from Hubject.
- ISO Version: The ISO standard version supported by Hubject.

#### Charging Station CA

- Name: The name of the charging station certificate authority.

##### Acme

- Env: The environment setting for Acme services (e.g., staging, production).
- Account Key File Path: The file path for the account key.
- Email: The contact email associated with the CA.
