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
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`

        create table "EventData" (
          id serial4 not null,
          "stationId" varchar(255) null,
          "eventId" int4 null,
          "trigger" varchar(255) null,
          cause int4 null,
          "timestamp" timestamptz null,
          "actualValue" varchar(255) null,
          "techCode" varchar(255) null,
          "techInfo" varchar(255) null,
          cleared bool null,
          "transactionId" varchar(255) null,
          "variableMonitoringId" int4 null,
          "eventNotificationType" varchar(255) null,
          "variableId" int4 null,
          "componentId" int4 null,
          "createdAt" timestamptz not null,
          "updatedAt" timestamptz not null,
          "tenantId" int4 default 1 not null,
          constraint "EventData_pkey" primary key (id),
          constraint "EventData_stationId_eventId_key" unique ("stationId",
        "eventId")
        );

        create index event_data_station_id on
        "EventData"
          using btree ("stationId");

        alter table "EventData" add constraint "EventData_componentId_fkey" foreign key ("componentId") references "Components"(id) on
        update
          cascade;

        alter table "EventData" add constraint "EventData_tenantId_fkey" foreign key ("tenantId") references "Tenants"(id) on 
        delete restrict on 
          update cascade;

        alter table "EventData" add constraint "EventData_variableId_fkey" foreign key ("variableId") references "Variables"(id) on
        update
          cascade;
            
        create table if not exists "SecurityEvents"
        (
            id          serial primary key,
            "stationId" varchar(255),
            type        varchar(255),
            timestamp   timestamp with time zone,
            "techInfo"  varchar(255),
            "createdAt" timestamp with time zone not null,
            "updatedAt" timestamp with time zone not null,
            "tenantId" int4 DEFAULT 1 not null
        );

        create index if not exists security_events_station_id
            on "SecurityEvents" ("stationId");
            
        alter table "SecurityEvents" add constraint "SecurityEvents_tenantId_fkey" foreign key ("tenantId") references "Tenants"(id) on delete restrict on update cascade;
    `);
  },
};
