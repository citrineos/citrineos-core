// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { defineHook } from '@directus/extensions-sdk';

export default defineHook(({ action }, { env }) => {
  action('ChargingStations.items.create', (input) => {
    console.log('Subscribing ' + input.key + ' to connect and close events');

    const stationId = input.key;
    const subscriptionUrl = `${env.CITRINEOS_URL}${env.CITRINEOS_SUBSCRIPTION_API_PATH}`;
    const updateStationStatusUrl = `${env.DIRECTUS_URL}${env.DIRECTUS_CHARGING_STATION_UPDATE_STATUS_PATH}`;
    const requestBody = {
      stationId: stationId,
      onConnect: true,
      onClose: true,
      url: updateStationStatusUrl,
    };

    console.log(
      'Subscribing to ' + subscriptionUrl + ' with request body ' + JSON.stringify(requestBody),
    );
    fetch(subscriptionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => {
        console.log('Response: ', response);
      })
      .catch((error) => {
        console.log('Error: ', error);
      });
  });
});
