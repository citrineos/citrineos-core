'use strict';

import { QueryInterface } from 'sequelize';

export = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
    
        DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_type WHERE typname = 'enum_InstalledCertificates_certificateType'
            ) THEN
              CREATE TYPE "enum_InstalledCertificates_certificateType" AS ENUM (
                'V2GRootCertificate', 
                'MORootCertificate', 
                'CSMSRootCertificate', 
                'V2GCertificateChain', 
                'ManufacturerRootCertificate'
              );
            END IF;
          END$$;
          
        DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_type WHERE typname = 'enum_Connectors_status'
            ) THEN
              CREATE TYPE "enum_Connectors_status" AS ENUM (
                'Available',
                'Preparing',
                'Charging',
                'SuspendedEVSE',
                'SuspendedEV',
                'Finishing',
                'Reserved',
                'Unavailable',
                'Faulted'
              );
            END IF;
          END$$;
          
        DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_type WHERE typname = 'enum_Connectors_errorCode'
            ) THEN
              CREATE TYPE "enum_Connectors_errorCode" AS ENUM (
                'ConnectorLockFailure', 
                'EVCommunicationError',
                'GroundFailure',
                'HighTemperature',
                'InternalError',
                'LocalListConflict',
                'NoError',
                'OtherError',
                'OverCurrentFailure',
                'PowerMeterFailure',
                'PowerSwitchFailure',
                'ReaderFailure',
                'ResetFailure',
                'UnderVoltage',
                'OverVoltage',
                'WeakSignal'
              );
            END IF;
          END$$;
          
        create table if not exists "AdditionalInfos"
        (
            id                  serial
                primary key,
            "additionalIdToken" varchar(255),
            type                varchar(255),
            "createdAt"         timestamp with time zone not null,
            "updatedAt"         timestamp with time zone not null,
            unique ("additionalIdToken", type)
        );

        create table if not exists "IdTokens"
        (
            id          serial
                primary key,
            "idToken"   varchar(255),
            type        varchar(255),
            "createdAt" timestamp with time zone not null,
            "updatedAt" timestamp with time zone not null,
            unique ("idToken", type)
        );

        create unique index if not exists id_tokens_id_token
            on "IdTokens" ("idToken")
            where (type IS NULL);

        create table if not exists "IdTokenInfos"
        (
            id                    serial
                primary key,
            status                varchar(255),
            "cacheExpiryDateTime" timestamp with time zone,
            "chargingPriority"    integer,
            language1             varchar(255),
            "groupIdTokenId"      integer
                references "IdTokens"
                    on update cascade,
            language2             varchar(255),
            "personalMessage"     json,
            "createdAt"           timestamp with time zone not null,
            "updatedAt"           timestamp with time zone not null
        );

        create table if not exists "Authorizations"
        (
            id                         serial
                primary key,
            "allowedConnectorTypes"    varchar(255)[],
            "disallowedEvseIdPrefixes" varchar(255)[],
            "idTokenId"                integer
                unique
                references "IdTokens"
                    on update cascade,
            "idTokenInfoId"            integer
                references "IdTokenInfos"
                    on update cascade,
            "createdAt"                timestamp with time zone not null,
            "updatedAt"                timestamp with time zone not null
        );

        create table if not exists "Boots"
        (
            id                              varchar(255)             not null
                primary key,
            "lastBootTime"                  timestamp with time zone,
            "heartbeatInterval"             integer,
            "bootRetryInterval"             integer,
            status                          varchar(255),
            "statusInfo"                    json,
            "getBaseReportOnPending"        boolean,
            "variablesRejectedOnLastBoot"   json,
            "bootWithRejectedVariables"     boolean,
            "changeConfigurationsOnPending" boolean,
            "getConfigurationsOnPending"    boolean,
            "createdAt"                     timestamp with time zone not null,
            "updatedAt"                     timestamp with time zone not null
        );

        create table if not exists "Certificates"
        (
            id                   serial
                primary key,
            "serialNumber"       bigint,
            "issuerName"         varchar(255),
            "organizationName"   varchar(255),
            "commonName"         varchar(255),
            "keyLength"          integer,
            "validBefore"        timestamp with time zone,
            "signatureAlgorithm" varchar(255),
            "countryName"        varchar(255),
            "isCA"               boolean,
            "pathLen"            integer,
            "certificateFileId"  varchar(255),
            "privateKeyFileId"   varchar(255),
            "signedBy"           varchar(255),
            "createdAt"          timestamp with time zone not null,
            "updatedAt"          timestamp with time zone not null,
            unique ("serialNumber", "issuerName")
        );

        create table if not exists "InstalledCertificates"
        (
            id                serial
                primary key,
            "stationId"       varchar(36)                                  not null,
            "hashAlgorithm"   varchar(255)                                 not null,
            "issuerNameHash"  varchar(255)                                 not null,
            "issuerKeyHash"   varchar(255)                                 not null,
            "serialNumber"    varchar(255)                                 not null,
            "certificateType" "enum_InstalledCertificates_certificateType" not null,
            "createdAt"       timestamp with time zone                     not null,
            "updatedAt"       timestamp with time zone                     not null
        );

        create table if not exists "ChangeConfigurations"
        (
            id          serial
                primary key,
            "stationId" varchar(255)             not null,
            key         varchar(50)              not null,
            value       varchar(500),
            readonly    boolean,
            "createdAt" timestamp with time zone not null,
            "updatedAt" timestamp with time zone not null,
            unique ("stationId", key)
        );

        create table if not exists "Evses"
        (
            "databaseId"  serial
                primary key,
            id            integer,
            "connectorId" integer,
            "createdAt"   timestamp with time zone not null,
            "updatedAt"   timestamp with time zone not null,
            unique (id, "connectorId")
        );

        create unique index if not exists evses_id
            on "Evses" (id)
            where ("connectorId" IS NULL);

        create table if not exists "Locations"
        (
            id           serial
                primary key,
            name         varchar(255),
            address      varchar(255),
            city         varchar(255),
            "postalCode" varchar(255),
            state        varchar(255),
            country      varchar(255),
            coordinates  geometry(Point),
            "createdAt"  timestamp with time zone not null,
            "updatedAt"  timestamp with time zone not null
        );

        create table if not exists "ChargingStations"
        (
            id                        varchar(36)              not null
                primary key,
            "isOnline"                boolean,
            protocol                  varchar(255),
            "chargePointVendor"       varchar(20),
            "chargePointModel"        varchar(20),
            "chargePointSerialNumber" varchar(25),
            "chargeBoxSerialNumber"   varchar(25),
            "firmwareVersion"         varchar(50),
            iccid                     varchar(20),
            imsi                      varchar(20),
            "meterType"               varchar(25),
            "meterSerialNumber"       varchar(25),
            "locationId"              integer
                references "Locations"
                    on update cascade,
            "createdAt"               timestamp with time zone not null,
            "updatedAt"               timestamp with time zone not null
        );

        create table if not exists "Transactions"
        (
            id                  serial
                primary key,
            "stationId"         varchar(255)
                references "ChargingStations"
                    on update cascade,
            "evseDatabaseId"    integer
                references "Evses"
                    on update cascade,
            "transactionId"     varchar(255),
            "isActive"          boolean,
            "chargingState"     varchar(255),
            "timeSpentCharging" bigint,
            "totalKwh"          numeric,
            "stoppedReason"     varchar(255),
            "remoteStartId"     integer,
            "totalCost"         numeric,
            "createdAt"         timestamp with time zone not null,
            "updatedAt"         timestamp with time zone not null,
            unique ("stationId", "transactionId")
        );

        create table if not exists "ChargingNeeds"
        (
            id                        serial
                primary key,
            "acChargingParameters"    jsonb,
            "dcChargingParameters"    jsonb,
            "departureTime"           timestamp with time zone,
            "requestedEnergyTransfer" varchar(255),
            "maxScheduleTuples"       integer,
            "evseDatabaseId"          integer
                references "Evses"
                    on update cascade,
            "transactionDatabaseId"   integer
                references "Transactions"
                    on update cascade,
            "createdAt"               timestamp with time zone not null,
            "updatedAt"               timestamp with time zone not null
        );

        create table if not exists "ChargingProfiles"
        (
            "databaseId"             serial
                primary key,
            "stationId"              varchar(255),
            id                       integer,
            "chargingProfileKind"    varchar(255),
            "chargingProfilePurpose" varchar(255),
            "recurrencyKind"         varchar(255),
            "stackLevel"             integer,
            "validFrom"              timestamp with time zone,
            "validTo"                timestamp with time zone,
            "evseId"                 integer,
            "isActive"               boolean      default false,
            "chargingLimitSource"    varchar(255) default 'CSO'::character varying,
            "createdAt"              timestamp with time zone not null,
            "updatedAt"              timestamp with time zone not null,
            "transactionDatabaseId"  integer
                                                              references "Transactions"
                                                                  on update cascade on delete set null,
            unique ("stationId", id)
        );

        create table if not exists "ChargingSchedules"
        (
            "databaseId"                serial
                primary key,
            id                          integer,
            "stationId"                 varchar(255),
            "chargingRateUnit"          varchar(255),
            "chargingSchedulePeriod"    jsonb,
            duration                    integer,
            "minChargingRate"           numeric,
            "startSchedule"             varchar(255),
            "timeBase"                  timestamp with time zone,
            "chargingProfileDatabaseId" integer
                references "ChargingProfiles"
                    on update cascade on delete cascade,
            "createdAt"                 timestamp with time zone not null,
            "updatedAt"                 timestamp with time zone not null,
            unique (id, "stationId")
        );

        create table if not exists "ServerNetworkProfiles"
        (
            id                                    varchar(255)             not null
                primary key,
            host                                  varchar(255),
            port                                  integer,
            "pingInterval"                        integer,
            protocol                              varchar(255),
            "messageTimeout"                      integer,
            "securityProfile"                     integer,
            "allowUnknownChargingStations"        boolean,
            "tlsKeyFilePath"                      varchar(255),
            "tlsCertificateChainFilePath"         varchar(255),
            "mtlsCertificateAuthorityKeyFilePath" varchar(255),
            "rootCACertificateFilePath"           varchar(255),
            "createdAt"                           timestamp with time zone not null,
            "updatedAt"                           timestamp with time zone not null
        );

        create table if not exists "SetNetworkProfiles"
        (
            id                        serial
                primary key,
            "stationId"               varchar(255),
            "correlationId"           varchar(255)
                unique,
            "websocketServerConfigId" varchar(255)
                references "ServerNetworkProfiles"
                    on update cascade,
            "configurationSlot"       integer,
            "ocppVersion"             varchar(255),
            "ocppTransport"           varchar(255),
            "ocppCsmsUrl"             varchar(255),
            "messageTimeout"          integer,
            "securityProfile"         integer,
            "ocppInterface"           varchar(255),
            apn                       varchar(255),
            vpn                       varchar(255),
            "createdAt"               timestamp with time zone not null,
            "updatedAt"               timestamp with time zone not null
        );

        create index if not exists set_network_profiles_correlation_id
            on "SetNetworkProfiles" ("correlationId");

        create table if not exists "ChargingStationNetworkProfiles"
        (
            "stationId"               varchar(36)              not null
                references "ChargingStations"
                    on update cascade on delete cascade,
            "configurationSlot"       integer
                unique,
            "setNetworkProfileId"     integer                  not null
                references "SetNetworkProfiles"
                    on update cascade on delete cascade,
            "websocketServerConfigId" varchar(255)
                references "ServerNetworkProfiles"
                    on update cascade,
            "createdAt"               timestamp with time zone not null,
            "updatedAt"               timestamp with time zone not null,
            primary key ("stationId", "setNetworkProfileId"),
            constraint "ChargingStationNetworkProfile_stationId_websocketServerConf_key"
                unique ("stationId", "websocketServerConfigId")
        );

        create table if not exists "ChargingStationSecurityInfos"
        (
            id                serial
                primary key,
            "stationId"       varchar(255)
                unique,
            "publicKeyFileId" varchar(255),
            "createdAt"       timestamp with time zone not null,
            "updatedAt"       timestamp with time zone not null
        );

        create table if not exists "ChargingStationSequences"
        (
            id          serial
                primary key,
            "stationId" varchar(36)              not null
                references "ChargingStations"
                    on update cascade,
            type        varchar(255)             not null,
            value       bigint default 0         not null,
            "createdAt" timestamp with time zone not null,
            "updatedAt" timestamp with time zone not null,
            unique ("stationId", type)
        );

        create table if not exists "Components"
        (
            id               serial
                primary key,
            name             varchar(255),
            instance         varchar(255),
            "evseDatabaseId" integer
                references "Evses"
                    on update cascade,
            "createdAt"      timestamp with time zone not null,
            "updatedAt"      timestamp with time zone not null,
            unique (name, instance)
        );

        create unique index if not exists components_name
            on "Components" (name)
            where (instance IS NULL);

        create table if not exists "Variables"
        (
            id          serial
                primary key,
            name        varchar(255),
            instance    varchar(255),
            "createdAt" timestamp with time zone not null,
            "updatedAt" timestamp with time zone not null,
            unique (name, instance)
        );

        create unique index if not exists variables_name
            on "Variables" (name)
            where (instance IS NULL);

        create table if not exists "ComponentVariables"
        (
            "componentId" integer                  not null
                references "Components"
                    on update cascade on delete cascade,
            "variableId"  integer                  not null
                references "Variables"
                    on update cascade on delete cascade,
            "createdAt"   timestamp with time zone not null,
            "updatedAt"   timestamp with time zone not null,
            primary key ("componentId", "variableId")
        );

        create table if not exists "CompositeSchedules"
        (
            id                       serial
                primary key,
            "stationId"              varchar(255),
            "evseId"                 integer,
            duration                 integer,
            "scheduleStart"          timestamp with time zone,
            "chargingRateUnit"       varchar(255),
            "chargingSchedulePeriod" jsonb,
            "createdAt"              timestamp with time zone not null,
            "updatedAt"              timestamp with time zone not null
        );

        create table if not exists "Connectors"
        (
            id                serial
                primary key,
            "stationId"       varchar(255)             not null
                references "ChargingStations"
                    on update cascade on delete cascade,
            "connectorId"     integer                  not null,
            status            "enum_Connectors_status",
            "errorCode"       "enum_Connectors_errorCode",
            timestamp         timestamp with time zone,
            info              varchar(255),
            "vendorId"        varchar(255),
            "vendorErrorCode" varchar(255),
            "createdAt"       timestamp with time zone not null,
            "updatedAt"       timestamp with time zone not null,
            unique ("stationId", "connectorId")
        );

        create table if not exists "EventData"
        (
            id                      serial
                primary key,
            "stationId"             varchar(255),
            "eventId"               integer,
            trigger                 varchar(255),
            cause                   integer,
            timestamp               timestamp with time zone,
            "actualValue"           varchar(255),
            "techCode"              varchar(255),
            "techInfo"              varchar(255),
            cleared                 boolean,
            "transactionId"         varchar(255),
            "variableMonitoringId"  integer,
            "eventNotificationType" varchar(255),
            "variableId"            integer
                references "Variables"
                    on update cascade,
            "componentId"           integer
                references "Components"
                    on update cascade,
            "createdAt"             timestamp with time zone not null,
            "updatedAt"             timestamp with time zone not null,
            unique ("stationId", "eventId")
        );

        create index if not exists event_data_station_id
            on "EventData" ("stationId");

        create table if not exists "IdTokenAdditionalInfos"
        (
            "idTokenId"        integer                  not null
                references "IdTokens"
                    on update cascade on delete cascade,
            "additionalInfoId" integer                  not null
                references "AdditionalInfos"
                    on update cascade on delete cascade,
            "createdAt"        timestamp with time zone not null,
            "updatedAt"        timestamp with time zone not null,
            primary key ("idTokenId", "additionalInfoId")
        );

        create table if not exists "TransactionEvents"
        (
            id                      serial
                primary key,
            "stationId"             varchar(255),
            "eventType"             varchar(255),
            timestamp               timestamp with time zone,
            "triggerReason"         varchar(255),
            "seqNo"                 integer,
            offline                 boolean default false,
            "numberOfPhasesUsed"    integer,
            "cableMaxCurrent"       numeric,
            "reservationId"         integer,
            "transactionInfo"       json,
            "createdAt"             timestamp with time zone not null,
            "updatedAt"             timestamp with time zone not null,
            "transactionDatabaseId" integer
                                                             references "Transactions"
                                                                 on update cascade on delete set null,
            "evseId"                integer
                                                             references "Evses"
                                                                 on update cascade on delete set null,
            "idTokenId"             integer
                                                             references "IdTokens"
                                                                 on update cascade on delete set null
        );

        create table if not exists "StopTransactions"
        (
            id                      serial
                primary key,
            "stationId"             varchar(255),
            "transactionDatabaseId" integer
                unique
                references "Transactions"
                    on update cascade on delete cascade,
            "meterStop"             integer,
            timestamp               timestamp with time zone,
            reason                  varchar(255),
            "createdAt"             timestamp with time zone not null,
            "updatedAt"             timestamp with time zone not null,
            "idTokenDatabaseId"     integer
                                                             references "IdTokens"
                                                                 on update cascade on delete set null
        );

        create table if not exists "MeterValues"
        (
            id                          serial
                primary key,
            "transactionEventId"        integer
                references "TransactionEvents"
                    on update cascade on delete cascade,
            "transactionDatabaseId"     integer
                references "Transactions"
                    on update cascade on delete cascade,
            "stopTransactionDatabaseId" integer
                references "StopTransactions"
                    on update cascade on delete cascade,
            "sampledValue"              json,
            timestamp                   timestamp with time zone,
            "connectorId"               integer,
            "createdAt"                 timestamp with time zone not null,
            "updatedAt"                 timestamp with time zone not null
        );

        create table if not exists "MessageInfos"
        (
            "databaseId"         serial
                primary key,
            "stationId"          varchar(255),
            id                   integer,
            priority             varchar(255),
            state                varchar(255),
            "startDateTime"      timestamp with time zone,
            "endDateTime"        timestamp with time zone,
            "transactionId"      varchar(255),
            message              json,
            active               boolean,
            "displayComponentId" integer
                references "Components"
                    on update cascade,
            "createdAt"          timestamp with time zone not null,
            "updatedAt"          timestamp with time zone not null,
            unique ("stationId", id)
        );

        create index if not exists message_infos_station_id
            on "MessageInfos" ("stationId");

        create table if not exists "OCPPMessages"
        (
            id              serial
                primary key,
            "stationId"     varchar(255),
            "correlationId" varchar(255),
            origin          varchar(255),
            protocol        varchar(255),
            action          varchar(255),
            message         jsonb,
            timestamp       timestamp with time zone,
            "createdAt"     timestamp with time zone not null,
            "updatedAt"     timestamp with time zone not null
        );

        create index if not exists o_c_p_p_messages_station_id
            on "OCPPMessages" ("stationId");

        create index if not exists o_c_p_p_messages_correlation_id
            on "OCPPMessages" ("correlationId");

        create table if not exists "Reservations"
        (
            "databaseId"              serial
                primary key,
            id                        integer,
            "stationId"               varchar(255),
            "expiryDateTime"          timestamp with time zone,
            "connectorType"           varchar(255),
            "reserveStatus"           varchar(255),
            "isActive"                boolean default false,
            "terminatedByTransaction" varchar(255),
            "idToken"                 jsonb,
            "groupIdToken"            jsonb,
            "createdAt"               timestamp with time zone not null,
            "updatedAt"               timestamp with time zone not null,
            "evseId"                  integer
                                                               references "Evses"
                                                                   on update cascade on delete set null,
            unique (id, "stationId")
        );

        create table if not exists "SalesTariffs"
        (
            "databaseId"                 serial
                primary key,
            id                           integer,
            "numEPriceLevels"            integer,
            "salesTariffDescription"     varchar(255),
            "salesTariffEntry"           jsonb,
            "chargingScheduleDatabaseId" integer
                references "ChargingSchedules"
                    on update cascade on delete cascade,
            "createdAt"                  timestamp with time zone not null,
            "updatedAt"                  timestamp with time zone not null,
            unique (id, "chargingScheduleDatabaseId")
        );

        create table if not exists "SecurityEvents"
        (
            id          serial
                primary key,
            "stationId" varchar(255),
            type        varchar(255),
            timestamp   timestamp with time zone,
            "techInfo"  varchar(255),
            "createdAt" timestamp with time zone not null,
            "updatedAt" timestamp with time zone not null
        );

        create index if not exists security_events_station_id
            on "SecurityEvents" ("stationId");

        create table if not exists "StartTransactions"
        (
            id                      serial
                primary key,
            "stationId"             varchar(255),
            "meterStart"            integer,
            timestamp               timestamp with time zone,
            "reservationId"         integer,
            "transactionDatabaseId" integer
                unique
                references "Transactions"
                    on update cascade on delete cascade,
            "createdAt"             timestamp with time zone not null,
            "updatedAt"             timestamp with time zone not null,
            "idTokenDatabaseId"     integer
                                                             references "IdTokens"
                                                                 on update cascade on delete set null,
            "connectorDatabaseId"   integer
                                                             references "Connectors"
                                                                 on update cascade on delete set null
        );

        create table if not exists "StatusNotifications"
        (
            id                serial
                primary key,
            timestamp         timestamp with time zone,
            "connectorStatus" varchar(255),
            "evseId"          integer,
            "connectorId"     integer,
            "errorCode"       varchar(255),
            info              varchar(255),
            "vendorId"        varchar(255),
            "vendorErrorCode" varchar(255),
            "createdAt"       timestamp with time zone not null,
            "updatedAt"       timestamp with time zone not null,
            "stationId"       varchar(36)
                                                       references "ChargingStations"
                                                           on update cascade on delete set null
        );

        create table if not exists "LatestStatusNotifications"
        (
            id                     serial
                primary key,
            "createdAt"            timestamp with time zone not null,
            "updatedAt"            timestamp with time zone not null,
            "stationId"            varchar(36)
                                                            references "ChargingStations"
                                                                on update cascade on delete set null,
            "statusNotificationId" integer
                                                            references "StatusNotifications"
                                                                on update cascade on delete set null
        );

        create table if not exists "Subscriptions"
        (
            id                   serial
                primary key,
            "stationId"          varchar(255),
            "onConnect"          boolean default false,
            "onClose"            boolean default false,
            "onMessage"          boolean default false,
            "sentMessage"        boolean default false,
            "messageRegexFilter" varchar(255),
            url                  varchar(255),
            "createdAt"          timestamp with time zone not null,
            "updatedAt"          timestamp with time zone not null
        );

        create index if not exists subscriptions_station_id
            on "Subscriptions" ("stationId");

        create table if not exists "Tariffs"
        (
            id                    serial
                primary key,
            "stationId"           varchar(255)
                unique,
            currency              char(3)                  not null,
            "pricePerKwh"         numeric                  not null,
            "pricePerMin"         numeric,
            "pricePerSession"     numeric,
            "authorizationAmount" numeric,
            "paymentFee"          numeric,
            "taxRate"             numeric,
            "createdAt"           timestamp with time zone not null,
            "updatedAt"           timestamp with time zone not null
        );

        create table if not exists "VariableAttributes"
        (
            id               serial
                primary key,
            "stationId"      varchar(255)             not null
                references "ChargingStations"
                    on update cascade,
            type             varchar(255) default 'Actual'::character varying,
            "dataType"       varchar(255) default 'string'::character varying,
            value            varchar(4000),
            mutability       varchar(255) default 'ReadWrite'::character varying,
            persistent       boolean      default false,
            constant         boolean      default false,
            "generatedAt"    timestamp with time zone,
            "variableId"     integer
                references "Variables"
                    on update cascade,
            "componentId"    integer
                references "Components"
                    on update cascade,
            "evseDatabaseId" integer
                references "Evses"
                    on update cascade,
            "createdAt"      timestamp with time zone not null,
            "updatedAt"      timestamp with time zone not null,
            "bootConfigId"   varchar(255)
                                                      references "Boots"
                                                          on update cascade on delete set null,
            unique ("stationId", type, "variableId", "componentId")
        );

        create unique index if not exists variable_attributes_station_id
            on "VariableAttributes" ("stationId")
            where ((type IS NULL) AND ("variableId" IS NULL) AND ("componentId" IS NULL));

        create unique index if not exists variable_attributes_station_id_type
            on "VariableAttributes" ("stationId", type)
            where (("variableId" IS NULL) AND ("componentId" IS NULL));

        create unique index if not exists variable_attributes_station_id_variable_id
            on "VariableAttributes" ("stationId", "variableId")
            where ((type IS NULL) AND ("componentId" IS NULL));

        create unique index if not exists variable_attributes_station_id_component_id
            on "VariableAttributes" ("stationId", "componentId")
            where ((type IS NULL) AND ("variableId" IS NULL));

        create unique index if not exists variable_attributes_station_id_type_variable_id
            on "VariableAttributes" ("stationId", type, "variableId")
            where ("componentId" IS NULL);

        create unique index if not exists variable_attributes_station_id_type_component_id
            on "VariableAttributes" ("stationId", type, "componentId")
            where ("variableId" IS NULL);

        create unique index if not exists variable_attributes_station_id_variable_id_component_id
            on "VariableAttributes" ("stationId", "variableId", "componentId")
            where (type IS NULL);

        create table if not exists "VariableCharacteristics"
        (
            id                   serial
                primary key,
            unit                 varchar(255),
            "dataType"           varchar(255),
            "minLimit"           numeric,
            "maxLimit"           numeric,
            "valuesList"         varchar(4000),
            "supportsMonitoring" boolean,
            "variableId"         integer
                unique
                references "Variables"
                    on update cascade,
            "createdAt"          timestamp with time zone not null,
            "updatedAt"          timestamp with time zone not null
        );

        create table if not exists "VariableMonitorings"
        (
            "databaseId"  serial
                primary key,
            "stationId"   varchar(255),
            id            integer,
            transaction   boolean,
            value         integer,
            type          varchar(255),
            severity      integer,
            "variableId"  integer
                references "Variables"
                    on update cascade,
            "componentId" integer
                references "Components"
                    on update cascade,
            "createdAt"   timestamp with time zone not null,
            "updatedAt"   timestamp with time zone not null,
            unique ("stationId", id)
        );

        create index if not exists variable_monitorings_station_id
            on "VariableMonitorings" ("stationId");

        create table if not exists "VariableMonitoringStatuses"
        (
            id                     serial
                primary key,
            status                 varchar(255),
            "statusInfo"           json,
            "variableMonitoringId" integer
                references "VariableMonitorings"
                    on update cascade,
            "createdAt"            timestamp with time zone not null,
            "updatedAt"            timestamp with time zone not null
        );

        create table if not exists "VariableStatuses"
        (
            id                    serial
                primary key,
            value                 varchar(4000),
            status                varchar(255),
            "statusInfo"          json,
            "variableAttributeId" integer
                references "VariableAttributes"
                    on update cascade on delete cascade,
            "createdAt"           timestamp with time zone not null,
            "updatedAt"           timestamp with time zone not null
        );

        create table if not exists "LocalListAuthorizations"
        (
            id                         serial
                primary key,
            "allowedConnectorTypes"    varchar(255)[],
            "disallowedEvseIdPrefixes" varchar(255)[],
            "idTokenId"                integer
                references "IdTokens"
                    on update cascade,
            "idTokenInfoId"            integer
                references "IdTokenInfos"
                    on update cascade,
            "authorizationId"          integer
                references "Authorizations"
                    on update cascade,
            "createdAt"                timestamp with time zone not null,
            "updatedAt"                timestamp with time zone not null
        );

        create table if not exists "LocalListVersions"
        (
            id              serial
                primary key,
            "stationId"     varchar(255)
                unique,
            "versionNumber" integer,
            "createdAt"     timestamp with time zone not null,
            "updatedAt"     timestamp with time zone not null
        );

        create table if not exists "LocalListVersionAuthorizations"
        (
            "localListVersionId" integer                  not null
                references "LocalListVersions"
                    on update cascade on delete cascade,
            "authorizationId"    integer                  not null
                references "LocalListAuthorizations"
                    on update cascade on delete cascade,
            "createdAt"          timestamp with time zone not null,
            "updatedAt"          timestamp with time zone not null,
            primary key ("localListVersionId", "authorizationId")
        );

        create table if not exists "SendLocalLists"
        (
            id              serial
                primary key,
            "stationId"     varchar(255),
            "correlationId" varchar(255),
            "versionNumber" integer,
            "updateType"    varchar(255),
            "createdAt"     timestamp with time zone not null,
            "updatedAt"     timestamp with time zone not null
        );

        create table if not exists "SendLocalListAuthorizations"
        (
            "sendLocalListId" integer                  not null
                references "SendLocalLists"
                    on update cascade on delete cascade,
            "authorizationId" integer                  not null
                references "LocalListAuthorizations"
                    on update cascade on delete cascade,
            "createdAt"       timestamp with time zone not null,
            "updatedAt"       timestamp with time zone not null,
            primary key ("sendLocalListId", "authorizationId")
        );
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
        DROP TABLE IF EXISTS "SendLocalListAuthorizations";
        DROP TABLE IF EXISTS "SendLocalLists";
        DROP TABLE IF EXISTS "LocalListVersionAuthorizations";
        DROP TABLE IF EXISTS "LocalListVersions";
        DROP TABLE IF EXISTS "LocalListAuthorizations";
        DROP TABLE IF EXISTS "VariableStatuses";
        DROP TABLE IF EXISTS "VariableMonitoringStatuses";
        DROP TABLE IF EXISTS "VariableMonitorings";
        DROP TABLE IF EXISTS "VariableCharacteristics";
        DROP TABLE IF EXISTS "VariableAttributes";
        DROP TABLE IF EXISTS "Tariffs";
        DROP TABLE IF EXISTS "Subscriptions";
        DROP TABLE IF EXISTS "LatestStatusNotifications";
        DROP TABLE IF EXISTS "StatusNotifications";
        DROP TABLE IF EXISTS "StartTransactions";
        DROP TABLE IF EXISTS "SecurityEvents";
        DROP TABLE IF EXISTS "SalesTariffs";
        DROP TABLE IF EXISTS "Reservations";
        DROP TABLE IF EXISTS "OCPPMessages";
        DROP TABLE IF EXISTS "MessageInfos";
        DROP TABLE IF EXISTS "MeterValues";
        DROP TABLE IF EXISTS "StopTransactions";
        DROP TABLE IF EXISTS "TransactionEvents";
        DROP TABLE IF EXISTS "IdTokenAdditionalInfos";
        DROP TABLE IF EXISTS "EventData";
        DROP TABLE IF EXISTS "Connectors";
        DROP TABLE IF EXISTS "CompositeSchedules";
        DROP TABLE IF EXISTS "ComponentVariables";
        DROP TABLE IF EXISTS "Variables";
        DROP TABLE IF EXISTS "Components";
        DROP TABLE IF EXISTS "ChargingStationSequences";
        DROP TABLE IF EXISTS "ChargingStationSecurityInfos";
        DROP TABLE IF EXISTS "ChargingStationNetworkProfiles";
        DROP TABLE IF EXISTS "SetNetworkProfiles";
        DROP TABLE IF EXISTS "ServerNetworkProfiles";
        DROP TABLE IF EXISTS "ChargingSchedules";
        DROP TABLE IF EXISTS "ChargingProfiles";
        DROP TABLE IF EXISTS "ChargingNeeds";
        DROP TABLE IF EXISTS "Transactions";
        DROP TABLE IF EXISTS "ChargingStations";
        DROP TABLE IF EXISTS "Locations";
        DROP TABLE IF EXISTS "Evses";
        DROP TABLE IF EXISTS "ChangeConfigurations";
        DROP TABLE IF EXISTS "InstalledCertificates";
        DROP TABLE IF EXISTS "Certificates";
        DROP TABLE IF EXISTS "Boots";
        DROP TABLE IF EXISTS "Authorizations";
        DROP TABLE IF EXISTS "IdTokenInfos";
        DROP TABLE IF EXISTS "IdTokens";
        DROP TABLE IF EXISTS "AdditionalInfos";
        DROP TYPE IF EXISTS "enum_InstalledCertificates_certificateType";
        DROP TYPE IF EXISTS "enum_Connectors_status";
        DROP TYPE IF EXISTS "enum_Connectors_errorCode";
    `);
  },
};
