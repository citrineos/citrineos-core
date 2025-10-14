// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use strict';

/** @type {import('sequelize-cli').Migration} */
import { DataTypes, QueryInterface } from 'sequelize';

const TABLE_NAME = 'Evses';

export = {
  up: async (queryInterface: QueryInterface) => {
    // First, let's get all the stations that have EvseTypes associated with them
    // through VariableAttributes
    const [stationEvseTypes] = await queryInterface.sequelize.query(`
      SELECT DISTINCT 
        cs.id as "stationId",
        cs."tenantId" as "tenantId",
        et.id as "evseTypeId",
        ROW_NUMBER() OVER (PARTITION BY cs.id, et.id ORDER BY va.id) as "evseSequence"
      FROM "ChargingStations" cs
      INNER JOIN "VariableAttributes" va ON va."stationId" = cs.id
      INNER JOIN "EvseTypes" et ON va."evseDatabaseId" = et."databaseId"
      WHERE cs.id IS NOT NULL 
        AND et.id IS NOT NULL
      ORDER BY cs.id, et.id
    `);

    // Now create Evse records for each station-evseType combination
    let id = 1;
    const evseInserts = stationEvseTypes.map((row: any, index: number) => {
      // Generate evseId in the format US*TST*C*01234567*8
      // Using the station's stationId and a sequence number
      const paddedSequence = row.evseSequence.toString().padStart(8, '0');
      const evseId = `US*TST*C*${paddedSequence}*${index % 10}`;

      const evse = {
        id,
        stationId: row.stationId,
        evseTypeId: row.evseTypeId,
        evseId: evseId,
        tenantId: row.tenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      id++;
      return evse;
    });

    // Bulk insert the new Evse records
    if (evseInserts.length > 0) {
      await queryInterface.bulkInsert('Evses', evseInserts);

      console.log(`Created ${evseInserts.length} Evse records from EvseType associations`);
    } else {
      console.log('No EvseType associations found to migrate');
    }
  },

  down: async (queryInterface: QueryInterface) => {
    // Remove all Evse records that were created by this migration
    // We'll identify them by the fact that they have evseIds matching our pattern
    await queryInterface.sequelize.query(`
      DELETE FROM "Evses" 
      WHERE "evseId" LIKE 'US*TST*C*%'
    `);

    console.log('Rolled back Evse creation migration');
  },
};
