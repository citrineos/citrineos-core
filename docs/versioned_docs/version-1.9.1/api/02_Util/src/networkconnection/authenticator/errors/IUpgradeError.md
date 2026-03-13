[**CitrineOS Core**](../../../../../index.md)

---

[CitrineOS Core](../../../../../index.md) / 02_Util/src/networkconnection/authenticator/errors/IUpgradeError

# 02_Util/src/networkconnection/authenticator/errors/IUpgradeError

## Interfaces

### IUpgradeError

Defined in: [02_Util/src/networkconnection/authenticator/errors/IUpgradeError.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/errors/IUpgradeError.ts#L7)

#### Methods

##### terminateConnection()

```ts
terminateConnection(socket): boolean;
```

Defined in: [02_Util/src/networkconnection/authenticator/errors/IUpgradeError.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/networkconnection/authenticator/errors/IUpgradeError.ts#L13)

Terminates the WebSocket connection by sending an error response and closing the socket.

###### Parameters

| Parameter | Type     | Description                  |
| --------- | -------- | ---------------------------- |
| `socket`  | `Duplex` | The WebSocket duplex stream. |

###### Returns

`boolean`

True if the connection was terminated successfully, false otherwise.
