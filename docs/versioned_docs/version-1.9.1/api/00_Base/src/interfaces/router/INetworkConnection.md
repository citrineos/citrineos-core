[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/router/INetworkConnection

# 00_Base/src/interfaces/router/INetworkConnection

## Interfaces

### INetworkConnection

Defined in: [00_Base/src/interfaces/router/INetworkConnection.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/router/INetworkConnection.ts#L10)

Interface for the ocpp network connection

#### Methods

##### addWebsocketServer()

```ts
addWebsocketServer(websocketServerConfig): Promise<void>;
```

Defined in: [00_Base/src/interfaces/router/INetworkConnection.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/router/INetworkConnection.ts#L17)

###### Parameters

| Parameter                                                    | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `websocketServerConfig`                                      | \{ `allowUnknownChargingStations`: `boolean`; `dynamicTenantResolution`: `boolean`; `host`: `string`; `id`: `string`; `ignoreAuthenticationHeaders?`: `boolean`; `maxConnectionsPerTenant?`: `number`; `mtlsCertificateAuthorityKeyFilePath?`: `string`; `pingInterval`: `number`; `port`: `number`; `protocols`: (`"ocpp1.6"` \| `"ocpp2.0.1"`)[]; `rootCACertificateFilePath?`: `string`; `securityProfile`: `number`; `tenantId`: `number`; `tenantPathMapping?`: `Record`\<`string`, `number`\>; `tlsCertificateChainFilePath?`: `string`; `tlsKeyFilePath?`: `string`; \} |
| `websocketServerConfig.allowUnknownChargingStations`         | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `websocketServerConfig.dynamicTenantResolution`              | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `websocketServerConfig.host`                                 | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `websocketServerConfig.id`                                   | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `websocketServerConfig.ignoreAuthenticationHeaders?`         | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `websocketServerConfig.maxConnectionsPerTenant?`             | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `websocketServerConfig.mtlsCertificateAuthorityKeyFilePath?` | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `websocketServerConfig.pingInterval`                         | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `websocketServerConfig.port`                                 | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `websocketServerConfig.protocols`                            | (`"ocpp1.6"` \| `"ocpp2.0.1"`)[]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `websocketServerConfig.rootCACertificateFilePath?`           | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `websocketServerConfig.securityProfile`                      | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `websocketServerConfig.tenantId`                             | `number`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `websocketServerConfig.tenantPathMapping?`                   | `Record`\<`string`, `number`\>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `websocketServerConfig.tlsCertificateChainFilePath?`         | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `websocketServerConfig.tlsKeyFilePath?`                      | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

###### Returns

`Promise`\<`void`\>

##### bindNetworkHook()

```ts
bindNetworkHook(): (identifier, message) => Promise<void>;
```

Defined in: [00_Base/src/interfaces/router/INetworkConnection.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/router/INetworkConnection.ts#L11)

###### Returns

```ts
(identifier, message): Promise<void>;
```

###### Parameters

| Parameter    | Type     |
| ------------ | -------- |
| `identifier` | `string` |
| `message`    | `string` |

###### Returns

`Promise`\<`void`\>

##### disconnect()

```ts
disconnect(tenantId, stationId): Promise<boolean>;
```

Defined in: [00_Base/src/interfaces/router/INetworkConnection.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/router/INetworkConnection.ts#L13)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `tenantId`  | `number` |
| `stationId` | `string` |

###### Returns

`Promise`\<`boolean`\>

##### shutdown()

```ts
shutdown(): Promise<void>;
```

Defined in: [00_Base/src/interfaces/router/INetworkConnection.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/router/INetworkConnection.ts#L15)

###### Returns

`Promise`\<`void`\>
