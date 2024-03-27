// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { defineHook } from '@directus/extensions-sdk';

export default defineHook(({ action }, { env }) => {

    action('ChargingStations.items.create', (input) => {
        console.log("Subscribing " + input.key + " to connect and close events");
        const stationId = input.key;
        const subscriptionUrl = `http://citrine:8080/data/ocpprouter/subscription`;
        const updateStationStatusUrl = "http://directus:8055/charging-stations/update-station-status";
        const requestBody = {
            stationId: stationId,
            onConnect: true,
            onClose: true,
            url: updateStationStatusUrl
        }

        fetch(subscriptionUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        }).then((response) => {
            console.log('Response: ', response);
        }).catch((error) => {
            console.log('Error: ', error);
        });
    });
});