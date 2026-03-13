[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 02_Util/src/networkconnection/authenticator/errors/UnknownError

# 02_Util/src/networkconnection/authenticator/errors/UnknownError

## Classes

### UpgradeUnknownError

Defined in: [02_Util/src/networkconnection/authenticator/errors/UnknownError.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/errors/UnknownError.ts#L8)

#### Extends

- `Error`

#### Implements

- [`IUpgradeError`](IUpgradeError.md#iupgradeerror)

#### Constructors

##### Constructor

```ts
new UpgradeUnknownError(message): UpgradeUnknownError;
```

Defined in: [02_Util/src/networkconnection/authenticator/errors/UnknownError.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/errors/UnknownError.ts#L9)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `message` | `string` |

###### Returns

[`UpgradeUnknownError`](#upgradeunknownerror)

###### Overrides

```ts
Error.constructor;
```

#### Methods

##### terminateConnection()

```ts
terminateConnection(socket): boolean;
```

Defined in: [02_Util/src/networkconnection/authenticator/errors/UnknownError.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/errors/UnknownError.ts#L14)

Terminates the WebSocket connection by sending an error response and closing the socket.

###### Parameters

| Parameter | Type     | Description                  |
| --------- | -------- | ---------------------------- |
| `socket`  | `Duplex` | The WebSocket duplex stream. |

###### Returns

`boolean`

True if the connection was terminated successfully, false otherwise.

###### Implementation of

[`IUpgradeError`](IUpgradeError.md#iupgradeerror).[`terminateConnection`](IUpgradeError.md#terminateconnection)
