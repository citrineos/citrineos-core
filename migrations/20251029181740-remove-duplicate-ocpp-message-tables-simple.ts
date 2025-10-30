// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { QueryInterface } from 'sequelize';

/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
        drop table if exists "EventData";
        drop table if exists "SecurityEvents";
        drop table if exists "VariableMonitoringStatuses";
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`

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
            "tenantId" int4 default 1 not null
                references "Tenants"
                    on update cascade on delete restrict,
            unique ("stationId", "eventId")
        );

        create index if not exists event_data_station_id
            on "EventData" ("stationId");
            
        create table if not exists "SecurityEvents"
        (
            id          serial primary key,
            "stationId" varchar(255),
            type        varchar(255),
            timestamp   timestamp with time zone,
            "techInfo"  varchar(255),
            "createdAt" timestamp with time zone not null,
            "updatedAt" timestamp with time zone not null,
            "tenantId" int4 default 1 not null
                references "Tenants"
                    on update cascade on delete restrict
        );

        create index if not exists security_events_station_id
            on "SecurityEvents" ("stationId");

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
            "updatedAt"            timestamp with time zone not null,
            "tenantId" int4 default 1 not null
                references "Tenants"
                    on update cascade on delete restrict
        );
    `);
  },
};
