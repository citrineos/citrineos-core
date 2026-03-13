[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/GetLocalListVersionResponse

# 00_Base/src/ocpp/model/2.0.1/types/GetLocalListVersionResponse

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetLocalListVersionResponse.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLocalListVersionResponse.ts#L25)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                              |
| -------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/GetLocalListVersionResponse.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLocalListVersionResponse.ts#L26) |

---

### GetLocalListVersionResponse

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetLocalListVersionResponse.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLocalListVersionResponse.ts#L13)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                                   | Type                                          | Description                                                                                       | Defined in                                                                                                                                                                                                                              |
| ------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?`      | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                 | [00_Base/src/ocpp/model/2.0.1/types/GetLocalListVersionResponse.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLocalListVersionResponse.ts#L14) |
| <a id="versionnumber"></a> `versionNumber` | `number`                                      | This contains the current version number of the local authorization list in the Charging Station. | [00_Base/src/ocpp/model/2.0.1/types/GetLocalListVersionResponse.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetLocalListVersionResponse.ts#L19) |
