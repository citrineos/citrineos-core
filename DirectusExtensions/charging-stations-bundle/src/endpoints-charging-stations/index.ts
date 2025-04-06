// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { defineEndpoint } from '@directus/extensions-sdk';

export default defineEndpoint({
  id: 'charging-stations',
  handler: (router, { database }) => {
    router.post('/update-station-status', async (req, res) => {
      try {
        console.log('update-station-status request received: ' + JSON.stringify(req.body));
        const { stationId, event } = req.body;
        let isOnline = false;

        // Determine the status based on the event type
        if (event === 'connected') {
          isOnline = true;
        } else if (event === 'closed') {
          isOnline = false;
        } else {
          // If the event type is neither 'connected' nor 'closed', return an error
          return res.status(400).json({
            message: 'Invalid event type, expecting only "connected" or "closed"',
          });
        }

        // Update the `isOnline` field in the `ChargingStation` collection for the specified stationId
        await database('ChargingStations').where({ id: stationId }).update({ isOnline });

        return res.status(200).json({ message: 'ChargingStation status updated successfully' });
      } catch (error) {
        console.error('Error updating ChargingStation status:', error);
        return res.status(500).json({ message: 'Internal server error' });
      }
    });
  },
});
