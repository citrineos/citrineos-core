---
title: Viewing OCPP Logs
---

# Viewing OCPP Logs

With CitrineOS, there are two ways to view OCPP logs.

The first way is to view the application logs as directly. This means navigating to either the docker console or the console of wherever CitrineOS was started from.

Below is an example of an OCPP log as found in the console:

```
2024-07-25 11:50:40.803 DEBUG   /Documents/citrineos-core/02_Util/src/queue/rabbit-mq/sender.ts:118 CitrineOS Logger:RabbitMqSender Publishing to citrineos: {
  origin: 'cs',
  eventGroup: 'general',
  action: 'BootNotification',
  context: {
    stationId: 'CS01',
    correlationId: '15106be4-57ca-11ee-8c99-0242ac120003',
    tenantId: '',
    timestamp: '2024-07-25T11:50:40.803Z'
  },
  state: 1,
  payload: {
    reason: 'PowerUp',
    chargingStation: {
      model: 'SingleSocketCharger',
      vendorName: 'CS01'
    }
  }
}
```

The second approach is to use CitrineOS's Data API to subscribe to OCPP messages. Below is a `cURL` command that will subscribe the specified URL to all OCPP messages and connection events for charger `CS01`:

```bash
curl --request POST 'localhost:8080/data/ocpprouter/subscription' \
--header 'Content-Type: application/json' \
--data '{
  "stationId": "CS01",
  "onConnect": true,
  "onClose": true,
  "onMessage": true,
  "sentMessage": true,
  "url": "https://2ae3db404d8c.ngrok.app"
}'
```
