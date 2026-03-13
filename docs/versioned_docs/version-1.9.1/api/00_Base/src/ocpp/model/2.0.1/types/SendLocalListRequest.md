[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest

# 00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest

## Interfaces

### AdditionalInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:70](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L70)

Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.

#### Properties

| Property                                           | Type                                          | Description                                                                                                                                   | Defined in                                                                                                                                                                                                                |
| -------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalidtoken"></a> `additionalIdToken` | `string`                                      | This field specifies the additional IdToken.                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:76](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L76) |
| <a id="customdata"></a> `customData?`              | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:71](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L71) |
| <a id="type"></a> `type`                           | `string`                                      | This defines the type of the additionalIdToken. This is a custom type, so the implementation needs to be agreed upon by all involved parties. | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:81](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L81) |

---

### AuthorizationData

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:44](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L44)

Contains the identifier to use for authorization.

#### Properties

| Property                                | Type                                            | Defined in                                                                                                                                                                                                                |
| --------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-1"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`   | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L45) |
| <a id="idtoken"></a> `idToken`          | [`IdTokenType`](#idtokentype)                   | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L46) |
| <a id="idtokeninfo"></a> `idTokenInfo?` | [`IdTokenInfoType`](#idtokeninfotype) \| `null` | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L47) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L36)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L37) |

---

### IdTokenInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:90](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L90)

ID\_ Token
urn:x-oca:ocpp:uid:2:233247
Contains status information about an identifier.
It is advised to not stop charging for a token that expires during charging, as ExpiryDate is only used for caching purposes. If ExpiryDate is not given, the status has no end date.

#### Properties

| Property                                                | Type                                                                     | Description                                                                                                                                                                                                                                                                          | Defined in                                                                                                                                                                                                                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="cacheexpirydatetime"></a> `cacheExpiryDateTime?` | `string` \| `null`                                                       | ID* Token. Expiry. Date* Time urn:x-oca:ocpp:uid:1:569373 Date and Time after which the token must be considered invalid.                                                                                                                                                            | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:99](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L99)   |
| <a id="chargingpriority"></a> `chargingPriority?`       | `number` \| `null`                                                       | Priority from a business point of view. Default priority is 0, The range is from -9 to 9. Higher values indicate a higher priority. The chargingPriority in &lt;&lt;transactioneventresponse,TransactionEventResponse&gt;&gt; overrules this one.                                    | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:104](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L104) |
| <a id="customdata-2"></a> `customData?`                 | [`CustomDataType`](#customdatatype) \| `null`                            | -                                                                                                                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:91](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L91)   |
| <a id="evseid"></a> `evseId?`                           | \[`number`, `...number[]`\] \| `null`                                    | Only used when the IdToken is only valid for one or more specific EVSEs, not for the entire Charging Station. **Min Items** 1                                                                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:120](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L120) |
| <a id="groupidtoken"></a> `groupIdToken?`               | [`IdTokenType`](#idtokentype) \| `null`                                  | -                                                                                                                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:121](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L121) |
| <a id="language1"></a> `language1?`                     | `string` \| `null`                                                       | ID* Token. Language1. Language* Code urn:x-oca:ocpp:uid:1:569374 Preferred user interface language of identifier user. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;.                                                                                 | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:112](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L112) |
| <a id="language2"></a> `language2?`                     | `string` \| `null`                                                       | ID* Token. Language2. Language* Code urn:x-oca:ocpp:uid:1:569375 Second preferred user interface language of identifier user. Don’t use when language1 is omitted, has to be different from language1. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;. | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:128](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L128) |
| <a id="personalmessage"></a> `personalMessage?`         | [`MessageContentType`](#messagecontenttype) \| `null`                    | -                                                                                                                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:129](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L129) |
| <a id="status"></a> `status`                            | [`AuthorizationStatusEnumType`](../enums.md#authorizationstatusenumtype) | -                                                                                                                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:92](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L92)   |

---

### IdTokenType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:53](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L53)

Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.

#### Properties

| Property                                      | Type                                                                                    | Description                                                                                                    | Defined in                                                                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalinfo"></a> `additionalInfo?` | \| \[[`AdditionalInfoType`](#additionalinfotype), `...AdditionalInfoType[]`\] \| `null` | **Min Items** 1                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:58](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L58) |
| <a id="customdata-3"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null`                                           | -                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:54](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L54) |
| <a id="idtoken-1"></a> `idToken`              | `string`                                                                                | IdToken is case insensitive. Might hold the hidden id of an RFID tag, but can for example also contain a UUID. | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:63](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L63) |
| <a id="type-1"></a> `type`                    | [`IdTokenEnumType`](../enums.md#idtokenenumtype)                                        | -                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:64](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L64) |

---

### MessageContentType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:138](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L138)

Message\_ Content
urn:x-enexis:ecdm:uid:2:234490
Contains message details, for a message to be displayed on a Charging Station.

#### Properties

| Property                                | Type                                                         | Description                                                                                                                                                                          | Defined in                                                                                                                                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="content"></a> `content`          | `string`                                                     | Message\_ Content. Content. Message urn:x-enexis:ecdm:uid:1:570852 Message contents.                                                                                                 | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:155](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L155) |
| <a id="customdata-4"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`                | -                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:139](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L139) |
| <a id="format"></a> `format`            | [`MessageFormatEnumType`](../enums.md#messageformatenumtype) | -                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:140](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L140) |
| <a id="language"></a> `language?`       | `string` \| `null`                                           | Message* Content. Language. Language* Code urn:x-enexis:ecdm:uid:1:570849 Message language identifier. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;. | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:147](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L147) |

---

### SendLocalListRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L19)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                                      | Type                                                                                 | Description                                                                                                                                                                    | Defined in                                                                                                                                                                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-5"></a> `customData?`                       | [`CustomDataType`](#customdatatype) \| `null`                                        | -                                                                                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L20) |
| <a id="localauthorizationlist"></a> `localAuthorizationList?` | \| \[[`AuthorizationData`](#authorizationdata), `...AuthorizationData[]`\] \| `null` | **Min Items** 1                                                                                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L24) |
| <a id="updatetype"></a> `updateType`                          | [`UpdateEnumType`](../enums.md#updateenumtype)                                       | -                                                                                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L30) |
| <a id="versionnumber"></a> `versionNumber`                    | `number`                                                                             | In case of a full update this is the version number of the full list. In case of a differential update it is the version number of the list after the update has been applied. | [00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/SendLocalListRequest.ts#L29) |
