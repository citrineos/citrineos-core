[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorRequest

# 00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorRequest.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorRequest.ts#L30)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                    |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorRequest.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorRequest.ts#L31) |

---

### UnlockConnectorRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorRequest.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorRequest.ts#L13)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                               | Type                                          | Description                                                                          | Defined in                                                                                                                                                                                                                    |
| -------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="connectorid"></a> `connectorId` | `number`                                      | This contains the identifier of the connector that needs to be unlocked.             | [00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorRequest.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorRequest.ts#L24) |
| <a id="customdata"></a> `customData?`  | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorRequest.ts#L14) |
| <a id="evseid"></a> `evseId`           | `number`                                      | This contains the identifier of the EVSE for which a connector needs to be unlocked. | [00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorRequest.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/UnlockConnectorRequest.ts#L19) |
