[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse

# 00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse

## Interfaces

### AdditionalInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:101](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L101)

Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.

#### Properties

| Property                                           | Type                                          | Description                                                                                                                                   | Defined in                                                                                                                                                                                                            |
| -------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalidtoken"></a> `additionalIdToken` | `string`                                      | This field specifies the additional IdToken.                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:107](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L107) |
| <a id="customdata"></a> `customData?`              | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:102](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L102) |
| <a id="type"></a> `type`                           | `string`                                      | This defines the type of the additionalIdToken. This is a custom type, so the implementation needs to be agreed upon by all involved parties. | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:112](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L112) |

---

### AuthorizeResponse

Defined in: [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L19)

#### Extends

- [`OcppResponse`](../../../../../src.md#ocppresponse)

#### Properties

| Property                                            | Type                                                                                                | Defined in                                                                                                                                                                                                          |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="certificatestatus"></a> `certificateStatus?` | \| [`AuthorizeCertificateStatusEnumType`](../enums.md#authorizecertificatestatusenumtype) \| `null` | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L22) |
| <a id="customdata-1"></a> `customData?`             | [`CustomDataType`](#customdatatype) \| `null`                                                       | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L20) |
| <a id="idtokeninfo"></a> `idTokenInfo`              | [`IdTokenInfoType`](#idtokeninfotype)                                                               | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L21) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L28)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                          |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L29) |

---

### IdTokenInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L39)

ID\_ Token
urn:x-oca:ocpp:uid:2:233247
Contains status information about an identifier.
It is advised to not stop charging for a token that expires during charging, as ExpiryDate is only used for caching purposes. If ExpiryDate is not given, the status has no end date.

#### Properties

| Property                                                | Type                                                                     | Description                                                                                                                                                                                                                                                                          | Defined in                                                                                                                                                                                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="cacheexpirydatetime"></a> `cacheExpiryDateTime?` | `string` \| `null`                                                       | ID* Token. Expiry. Date* Time urn:x-oca:ocpp:uid:1:569373 Date and Time after which the token must be considered invalid.                                                                                                                                                            | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L48) |
| <a id="chargingpriority"></a> `chargingPriority?`       | `number` \| `null`                                                       | Priority from a business point of view. Default priority is 0, The range is from -9 to 9. Higher values indicate a higher priority. The chargingPriority in &lt;&lt;transactioneventresponse,TransactionEventResponse&gt;&gt; overrules this one.                                    | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:53](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L53) |
| <a id="customdata-2"></a> `customData?`                 | [`CustomDataType`](#customdatatype) \| `null`                            | -                                                                                                                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L40) |
| <a id="evseid"></a> `evseId?`                           | \[`number`, `...number[]`\] \| `null`                                    | Only used when the IdToken is only valid for one or more specific EVSEs, not for the entire Charging Station. **Min Items** 1                                                                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:69](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L69) |
| <a id="groupidtoken"></a> `groupIdToken?`               | [`IdTokenType`](#idtokentype) \| `null`                                  | -                                                                                                                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:70](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L70) |
| <a id="language1"></a> `language1?`                     | `string` \| `null`                                                       | ID* Token. Language1. Language* Code urn:x-oca:ocpp:uid:1:569374 Preferred user interface language of identifier user. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;.                                                                                 | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:61](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L61) |
| <a id="language2"></a> `language2?`                     | `string` \| `null`                                                       | ID* Token. Language2. Language* Code urn:x-oca:ocpp:uid:1:569375 Second preferred user interface language of identifier user. Don’t use when language1 is omitted, has to be different from language1. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;. | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:77](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L77) |
| <a id="personalmessage"></a> `personalMessage?`         | [`MessageContentType`](#messagecontenttype) \| `null`                    | -                                                                                                                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:78](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L78) |
| <a id="status"></a> `status`                            | [`AuthorizationStatusEnumType`](../enums.md#authorizationstatusenumtype) | -                                                                                                                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:41](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L41) |

---

### IdTokenType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:84](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L84)

Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.

#### Properties

| Property                                      | Type                                                                                    | Description                                                                                                    | Defined in                                                                                                                                                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalinfo"></a> `additionalInfo?` | \| \[[`AdditionalInfoType`](#additionalinfotype), `...AdditionalInfoType[]`\] \| `null` | **Min Items** 1                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:89](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L89) |
| <a id="customdata-3"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null`                                           | -                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:85](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L85) |
| <a id="idtoken"></a> `idToken`                | `string`                                                                                | IdToken is case insensitive. Might hold the hidden id of an RFID tag, but can for example also contain a UUID. | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:94](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L94) |
| <a id="type-1"></a> `type`                    | [`IdTokenEnumType`](../enums.md#idtokenenumtype)                                        | -                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:95](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L95) |

---

### MessageContentType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:121](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L121)

Message\_ Content
urn:x-enexis:ecdm:uid:2:234490
Contains message details, for a message to be displayed on a Charging Station.

#### Properties

| Property                                | Type                                                         | Description                                                                                                                                                                          | Defined in                                                                                                                                                                                                            |
| --------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="content"></a> `content`          | `string`                                                     | Message\_ Content. Content. Message urn:x-enexis:ecdm:uid:1:570852 Message contents.                                                                                                 | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:138](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L138) |
| <a id="customdata-4"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`                | -                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:122](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L122) |
| <a id="format"></a> `format`            | [`MessageFormatEnumType`](../enums.md#messageformatenumtype) | -                                                                                                                                                                                    | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:123](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L123) |
| <a id="language"></a> `language?`       | `string` \| `null`                                           | Message* Content. Language. Language* Code urn:x-enexis:ecdm:uid:1:570849 Message language identifier. Contains a language code as defined in &lt;&lt;ref-RFC5646,[RFC5646]&gt;&gt;. | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts:130](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeResponse.ts#L130) |
