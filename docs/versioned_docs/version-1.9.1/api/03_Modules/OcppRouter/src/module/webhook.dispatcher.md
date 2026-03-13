[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 03_Modules/OcppRouter/src/module/webhook.dispatcher

# 03_Modules/OcppRouter/src/module/webhook.dispatcher

## Classes

### WebhookDispatcher

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L18)

#### Constructors

##### Constructor

```ts
new WebhookDispatcher(
   ocppMessageRepository,
   subscriptionRepository,
   logger?): WebhookDispatcher;
```

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L33)

###### Parameters

| Parameter                | Type                      |
| ------------------------ | ------------------------- |
| `ocppMessageRepository`  | `IOCPPMessageRepository`  |
| `subscriptionRepository` | `ISubscriptionRepository` |
| `logger?`                | `Logger`\<`ILogObj`\>     |

###### Returns

[`WebhookDispatcher`](#webhookdispatcher)

#### Properties

| Property                                                                         | Modifier    | Type                                                                   | Defined in                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_identifiers"></a> `_identifiers`                                         | `protected` | `Set`\<`string`\>                                                      | [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L25) |
| <a id="_logger"></a> `_logger`                                                   | `protected` | `Logger`\<`ILogObj`\>                                                  | [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L21) |
| <a id="_ocppmessagerepository"></a> `_ocppMessageRepository`                     | `protected` | `IOCPPMessageRepository`                                               | [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L22) |
| <a id="_onclosecallbacks"></a> `_onCloseCallbacks`                               | `protected` | `Map`\<`string`, [`OnCloseCallback`](#onclosecallback)[]\>             | [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L29) |
| <a id="_onconnectioncallbacks"></a> `_onConnectionCallbacks`                     | `protected` | `Map`\<`string`, [`OnConnectionCallback`](#onconnectioncallback)[]\>   | [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L28) |
| <a id="_onmessagecallbacks"></a> `_onMessageCallbacks`                           | `protected` | `Map`\<`string`, [`OnMessageCallback`](#onmessagecallback)[]\>         | [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L30) |
| <a id="_sentmessagecallbacks"></a> `_sentMessageCallbacks`                       | `protected` | `Map`\<`string`, [`OnSentMessageCallback`](#onsentmessagecallback)[]\> | [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L31) |
| <a id="_subscriptionrepository"></a> `_subscriptionRepository`                   | `protected` | `ISubscriptionRepository`                                              | [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L23) |
| <a id="subscription_refresh_interval_ms"></a> `SUBSCRIPTION_REFRESH_INTERVAL_MS` | `readonly`  | `number`                                                               | [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L19) |

#### Methods

##### \_loadSubscriptionsForConnection()

```ts
protected _loadSubscriptionsForConnection(tenantId, stationId): Promise<void>;
```

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:249](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L249)

Loads all subscriptions for a given connection into memory

###### Parameters

| Parameter   | Type     | Description |
| ----------- | -------- | ----------- |
| `tenantId`  | `number` | -           |
| `stationId` | `string` | -           |

###### Returns

`Promise`\<`void`\>

a promise that resolves once all subscriptions are loaded

##### \_onCloseCallback()

```ts
protected _onCloseCallback(subscription): (info?) => Promise<boolean>;
```

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:306](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L306)

###### Parameters

| Parameter      | Type           |
| -------------- | -------------- |
| `subscription` | `Subscription` |

###### Returns

```ts
(info?): Promise<boolean>;
```

###### Parameters

| Parameter | Type                        |
| --------- | --------------------------- |
| `info?`   | `Map`\<`string`, `string`\> |

###### Returns

`Promise`\<`boolean`\>

##### \_onConnectionCallback()

```ts
protected _onConnectionCallback(subscription): (info?) => Promise<boolean>;
```

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:294](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L294)

###### Parameters

| Parameter      | Type           |
| -------------- | -------------- |
| `subscription` | `Subscription` |

###### Returns

```ts
(info?): Promise<boolean>;
```

###### Parameters

| Parameter | Type                        |
| --------- | --------------------------- |
| `info?`   | `Map`\<`string`, `string`\> |

###### Returns

`Promise`\<`boolean`\>

##### \_onMessageReceivedCallback()

```ts
protected _onMessageReceivedCallback(subscription): (message, info?) => Promise<boolean>;
```

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:318](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L318)

###### Parameters

| Parameter      | Type           |
| -------------- | -------------- |
| `subscription` | `Subscription` |

###### Returns

```ts
(message, info?): Promise<boolean>;
```

###### Parameters

| Parameter | Type                        |
| --------- | --------------------------- |
| `message` | `string`                    |
| `info?`   | `Map`\<`string`, `string`\> |

###### Returns

`Promise`\<`boolean`\>

##### \_onMessageSentCallback()

```ts
protected _onMessageSentCallback(subscription): (message, info?) => Promise<boolean>;
```

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:341](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L341)

###### Parameters

| Parameter      | Type           |
| -------------- | -------------- |
| `subscription` | `Subscription` |

###### Returns

```ts
(message, info?): Promise<boolean>;
```

###### Parameters

| Parameter | Type                        |
| --------- | --------------------------- |
| `message` | `string`                    |
| `info?`   | `Map`\<`string`, `string`\> |

###### Returns

`Promise`\<`boolean`\>

##### \_refreshSubscriptions()

```ts
protected _refreshSubscriptions(): Promise<void>;
```

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:229](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L229)

###### Returns

`Promise`\<`void`\>

##### \_subscriptionCallback()

```ts
protected _subscriptionCallback(requestBody, url): Promise<boolean>;
```

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:371](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L371)

Sends a message to a given URL that has been subscribed to a station connection event

###### Parameters

| Parameter               | Type                                                                                                                                           | Description                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `requestBody`           | \{ `event`: `string`; `info?`: \{ \[`k`: `string`\]: `string`; \}; `message?`: `string`; `origin?`: `MessageOrigin`; `stationId`: `string`; \} | request body containing stationId, event, origin, message, error, and info |
| `requestBody.event`     | `string`                                                                                                                                       | -                                                                          |
| `requestBody.info?`     | \{ \[`k`: `string`\]: `string`; \}                                                                                                             | -                                                                          |
| `requestBody.message?`  | `string`                                                                                                                                       | -                                                                          |
| `requestBody.origin?`   | `MessageOrigin`                                                                                                                                | -                                                                          |
| `requestBody.stationId` | `string`                                                                                                                                       | -                                                                          |
| `url`                   | `string`                                                                                                                                       | the URL to fetch data from                                                 |

###### Returns

`Promise`\<`boolean`\>

a Promise that resolves to a boolean indicating success

##### deregister()

```ts
deregister(tenantId, stationId): Promise<void>;
```

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:62](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L62)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |

###### Returns

`Promise`\<`void`\>

##### dispatchMessageReceived()

```ts
dispatchMessageReceived(
   tenantId,
   stationId,
   timestamp,
   protocol,
   action,
   state,
rpcMessage): Promise<void>;
```

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:121](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L121)

###### Parameters

| Parameter    | Type              |
| ------------ | ----------------- |
| `tenantId`   | `number`          |
| `stationId`  | `string`          |
| `timestamp`  | `string`          |
| `protocol`   | `OCPPVersionType` |
| `action`     | `string`          |
| `state`      | `MessageState`    |
| `rpcMessage` | `any`             |

###### Returns

`Promise`\<`void`\>

##### dispatchMessageReceivedUnparsed()

```ts
dispatchMessageReceivedUnparsed(
   tenantId,
   stationId,
   message,
   timestamp,
   protocol,
   action,
state): Promise<void>;
```

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:78](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L78)

###### Parameters

| Parameter   | Type              |
| ----------- | ----------------- |
| `tenantId`  | `number`          |
| `stationId` | `string`          |
| `message`   | `string`          |
| `timestamp` | `string`          |
| `protocol`  | `OCPPVersionType` |
| `action`    | `string`          |
| `state`     | `MessageState`    |

###### Returns

`Promise`\<`void`\>

##### dispatchMessageSent()

```ts
dispatchMessageSent(
   identifier,
   action,
   state,
   timestamp,
   protocol,
rpcMessage): Promise<void>;
```

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:178](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L178)

###### Parameters

| Parameter    | Type              |
| ------------ | ----------------- |
| `identifier` | `string`          |
| `action`     | `string`          |
| `state`      | `MessageState`    |
| `timestamp`  | `string`          |
| `protocol`   | `OCPPVersionType` |
| `rpcMessage` | `any`             |

###### Returns

`Promise`\<`void`\>

##### register()

```ts
register(tenantId, stationId): Promise<void>;
```

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L49)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |

###### Returns

`Promise`\<`void`\>

## Type Aliases

### OnCloseCallback()

```ts
type OnCloseCallback = (info?) => Promise<boolean>;
```

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:410](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L410)

#### Parameters

| Parameter | Type                        |
| --------- | --------------------------- |
| `info?`   | `Map`\<`string`, `string`\> |

#### Returns

`Promise`\<`boolean`\>

---

### OnConnectionCallback()

```ts
type OnConnectionCallback = (info?) => Promise<boolean>;
```

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:408](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L408)

#### Parameters

| Parameter | Type                        |
| --------- | --------------------------- |
| `info?`   | `Map`\<`string`, `string`\> |

#### Returns

`Promise`\<`boolean`\>

---

### OnMessageCallback()

```ts
type OnMessageCallback = (message, info?) => Promise<boolean>;
```

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:412](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L412)

#### Parameters

| Parameter | Type                        |
| --------- | --------------------------- |
| `message` | `string`                    |
| `info?`   | `Map`\<`string`, `string`\> |

#### Returns

`Promise`\<`boolean`\>

---

### OnSentMessageCallback()

```ts
type OnSentMessageCallback = (message, info?) => Promise<boolean>;
```

Defined in: [03_Modules/OcppRouter/src/module/webhook.dispatcher.ts:414](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/03_Modules/OcppRouter/src/module/webhook.dispatcher.ts#L414)

#### Parameters

| Parameter | Type                        |
| --------- | --------------------------- |
| `message` | `string`                    |
| `info?`   | `Map`\<`string`, `string`\> |

#### Returns

`Promise`\<`boolean`\>
