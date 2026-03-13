[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest

# 00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest

## Interfaces

### AdditionalInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:64](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L64)

Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.

#### Properties

| Property                                           | Type                                          | Description                                                                                                                                   | Defined in                                                                                                                                                                                                          |
| -------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalidtoken"></a> `additionalIdToken` | `string`                                      | This field specifies the additional IdToken.                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:70](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L70) |
| <a id="customdata"></a> `customData?`              | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:65](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L65) |
| <a id="type"></a> `type`                           | `string`                                      | This defines the type of the additionalIdToken. This is a custom type, so the implementation needs to be agreed upon by all involved parties. | [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:75](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L75) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L39)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                          |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L40) |

---

### IdTokenType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L47)

Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.

#### Properties

| Property                                      | Type                                                                                    | Description                                                                                                    | Defined in                                                                                                                                                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalinfo"></a> `additionalInfo?` | \| \[[`AdditionalInfoType`](#additionalinfotype), `...AdditionalInfoType[]`\] \| `null` | **Min Items** 1                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L52) |
| <a id="customdata-1"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null`                                           | -                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L48) |
| <a id="idtoken"></a> `idToken`                | `string`                                                                                | IdToken is case insensitive. Might hold the hidden id of an RFID tag, but can for example also contain a UUID. | [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:57](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L57) |
| <a id="type-1"></a> `type`                    | [`IdTokenEnumType`](../enums.md#idtokenenumtype)                                        | -                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:58](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L58) |

---

### ReserveNowRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                     | Type                                                           | Description                                     | Defined in                                                                                                                                                                                                          |
| -------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="connectortype"></a> `connectorType?`  | [`ConnectorEnumType`](../enums.md#connectorenumtype) \| `null` | -                                               | [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L26) |
| <a id="customdata-2"></a> `customData?`      | [`CustomDataType`](#customdatatype) \| `null`                  | -                                               | [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L15) |
| <a id="evseid"></a> `evseId?`                | `number` \| `null`                                             | This contains ID of the evse to be reserved.    | [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L32) |
| <a id="expirydatetime"></a> `expiryDateTime` | `string`                                                       | Date and time at which the reservation expires. | [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L25) |
| <a id="groupidtoken"></a> `groupIdToken?`    | [`IdTokenType`](#idtokentype) \| `null`                        | -                                               | [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L33) |
| <a id="id"></a> `id`                         | `number`                                                       | Id of reservation.                              | [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L20) |
| <a id="idtoken-1"></a> `idToken`             | [`IdTokenType`](#idtokentype)                                  | -                                               | [00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts:27](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/ReserveNowRequest.ts#L27) |
