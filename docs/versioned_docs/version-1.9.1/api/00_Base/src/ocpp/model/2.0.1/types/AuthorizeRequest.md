[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest

# 00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest

## Interfaces

### AdditionalInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:62](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L62)

Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.

#### Properties

| Property                                           | Type                                          | Description                                                                                                                                   | Defined in                                                                                                                                                                                                        |
| -------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalidtoken"></a> `additionalIdToken` | `string`                                      | This field specifies the additional IdToken.                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:68](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L68) |
| <a id="customdata"></a> `customData?`              | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:63](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L63) |
| <a id="type"></a> `type`                           | `string`                                      | This defines the type of the additionalIdToken. This is a custom type, so the implementation needs to be agreed upon by all involved parties. | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:73](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L73) |

---

### AuthorizeRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                                                | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Description                                                       | Defined in                                                                                                                                                                                                        |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="certificate"></a> `certificate?`                                 | `string` \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | The X.509 certificated presented by EV and encoded in PEM format. | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L21) |
| <a id="customdata-1"></a> `customData?`                                 | [`CustomDataType`](#customdatatype) \| `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | -                                                                 | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L15) |
| <a id="idtoken"></a> `idToken`                                          | [`IdTokenType`](#idtokentype)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | -                                                                 | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L16) |
| <a id="iso15118certificatehashdata"></a> `iso15118CertificateHashData?` | \| \[[`OCSPRequestDataType`](#ocsprequestdatatype)\] \| \[[`OCSPRequestDataType`](#ocsprequestdatatype), [`OCSPRequestDataType`](#ocsprequestdatatype)\] \| \[[`OCSPRequestDataType`](#ocsprequestdatatype), [`OCSPRequestDataType`](#ocsprequestdatatype), [`OCSPRequestDataType`](#ocsprequestdatatype)\] \| \[[`OCSPRequestDataType`](#ocsprequestdatatype), [`OCSPRequestDataType`](#ocsprequestdatatype), [`OCSPRequestDataType`](#ocsprequestdatatype), [`OCSPRequestDataType`](#ocsprequestdatatype)\] \| `null` | **Min Items** 1 **Max Items** 4                                   | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L26) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L37)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                        |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:38](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L38) |

---

### IdTokenType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L45)

Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.

#### Properties

| Property                                      | Type                                                                                    | Description                                                                                                    | Defined in                                                                                                                                                                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalinfo"></a> `additionalInfo?` | \| \[[`AdditionalInfoType`](#additionalinfotype), `...AdditionalInfoType[]`\] \| `null` | **Min Items** 1                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L50) |
| <a id="customdata-2"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null`                                           | -                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L46) |
| <a id="idtoken-1"></a> `idToken`              | `string`                                                                                | IdToken is case insensitive. Might hold the hidden id of an RFID tag, but can for example also contain a UUID. | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:55](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L55) |
| <a id="type-1"></a> `type`                    | [`IdTokenEnumType`](../enums.md#idtokenenumtype)                                        | -                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:56](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L56) |

---

### OCSPRequestDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:75](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L75)

#### Properties

| Property                                     | Type                                                         | Description                                         | Defined in                                                                                                                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-3"></a> `customData?`      | [`CustomDataType`](#customdatatype) \| `null`                | -                                                   | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:76](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L76) |
| <a id="hashalgorithm"></a> `hashAlgorithm`   | [`HashAlgorithmEnumType`](../enums.md#hashalgorithmenumtype) | -                                                   | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:77](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L77) |
| <a id="issuerkeyhash"></a> `issuerKeyHash`   | `string`                                                     | Hashed value of the issuers public key              | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:88](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L88) |
| <a id="issuernamehash"></a> `issuerNameHash` | `string`                                                     | Hashed value of the Issuer DN (Distinguished Name). | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:83](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L83) |
| <a id="responderurl"></a> `responderURL`     | `string`                                                     | This contains the responder URL (Case insensitive). | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:99](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L99) |
| <a id="serialnumber"></a> `serialNumber`     | `string`                                                     | The serial number of the certificate.               | [00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts:93](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/AuthorizeRequest.ts#L93) |
