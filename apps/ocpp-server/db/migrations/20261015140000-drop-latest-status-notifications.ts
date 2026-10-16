// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

import { DataTypes, QueryInterface, QueryTypes } from 'sequelize';

/**
 * Connectors."latestStatusNotificationId" replaces LatestStatusNotifications.
 *
 * Before the table is dropped, each connector that has no pointer yet takes the newest
 * status notification the table held for it. A 1.6 status names its connector by the
 * station-wide connectorId; a 2.x status names it by EVSE and the connectorId within it.
 */
/** @type {import('sequelize-cli').Migration} */
export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
        WITH candidates AS (
          SELECT c."id" AS "connectorId", sn."id" AS "statusNotificationId", sn."createdAt"
            FROM "LatestStatusNotifications" AS l
            JOIN "StatusNotifications" AS sn ON sn."id" = l."statusNotificationId"
            JOIN "ChargingStations" AS cs ON cs."id" = sn."stationId"
            JOIN "Connectors" AS c
              ON c."stationId" = sn."stationId" AND c."tenantId" = sn."tenantId"
            JOIN "Evses" AS e ON e."id" = c."evseId"
           WHERE (cs."protocol" = 'ocpp1.6' AND c."connectorId" = sn."connectorId")
              OR (cs."protocol" IS DISTINCT FROM 'ocpp1.6'
                  AND e."evseTypeId" = sn."evseId"
                  AND c."evseTypeConnectorId" = sn."connectorId")
        ),
        newest AS (
          SELECT DISTINCT ON ("connectorId") "connectorId", "statusNotificationId"
            FROM candidates
           ORDER BY "connectorId", "createdAt" DESC, "statusNotificationId" DESC
        )
        UPDATE "Connectors" AS c
           SET "latestStatusNotificationId" = newest."statusNotificationId"
          FROM newest
         WHERE c."id" = newest."connectorId"
           AND c."latestStatusNotificationId" IS NULL
        `,
        { transaction, type: QueryTypes.UPDATE },
      );

      await queryInterface.dropTable('LatestStatusNotifications', { transaction });
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.createTable(
        'LatestStatusNotifications',
        {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          stationId: {
            type: DataTypes.INTEGER,
            references: {
              model: 'ChargingStations',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          statusNotificationId: {
            type: DataTypes.INTEGER,
            references: {
              model: 'StatusNotifications',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          tenantId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
              model: 'Tenants',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT',
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
          },
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        INSERT INTO "LatestStatusNotifications"
               ("stationId", "statusNotificationId", "tenantId", "createdAt", "updatedAt")
        SELECT DISTINCT sn."stationId", sn."id", sn."tenantId", now(), now()
          FROM "Connectors" AS c
          JOIN "StatusNotifications" AS sn ON sn."id" = c."latestStatusNotificationId"
        `,
        { transaction, type: QueryTypes.INSERT },
      );
    });
  },
};
