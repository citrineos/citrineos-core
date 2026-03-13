[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest

# 00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest

## Interfaces

### AdditionalInfoType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:90](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L90)

Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.

#### Properties

| Property                                           | Type                                          | Description                                                                                                                                   | Defined in                                                                                                                                                                                                                              |
| -------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalidtoken"></a> `additionalIdToken` | `string`                                      | This field specifies the additional IdToken.                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:96](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L96)   |
| <a id="customdata"></a> `customData?`              | [`CustomDataType`](#customdatatype) \| `null` | -                                                                                                                                             | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:91](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L91)   |
| <a id="type"></a> `type`                           | `string`                                      | This defines the type of the additionalIdToken. This is a custom type, so the implementation needs to be agreed upon by all involved parties. | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:101](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L101) |

---

### CertificateHashDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L49)

#### Properties

| Property                                     | Type                                                         | Description                                         | Defined in                                                                                                                                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata-1"></a> `customData?`      | [`CustomDataType`](#customdatatype) \| `null`                | -                                                   | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L50) |
| <a id="hashalgorithm"></a> `hashAlgorithm`   | [`HashAlgorithmEnumType`](../enums.md#hashalgorithmenumtype) | -                                                   | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L51) |
| <a id="issuerkeyhash"></a> `issuerKeyHash`   | `string`                                                     | Hashed value of the issuers public key              | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:62](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L62) |
| <a id="issuernamehash"></a> `issuerNameHash` | `string`                                                     | Hashed value of the Issuer DN (Distinguished Name). | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:57](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L57) |
| <a id="serialnumber"></a> `serialNumber`     | `string`                                                     | The serial number of the certificate.               | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:67](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L67) |

---

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L45)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                            |
| -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:46](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L46) |

---

### CustomerInformationRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                                                | Type                                                            | Description                                                                                                                                                                                                                                                                            | Defined in                                                                                                                                                                                                                            |
| ------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="clear"></a> `clear`                              | `boolean`                                                       | Flag indicating whether the Charging Station should clear all information about the customer referred to.                                                                                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L33) |
| <a id="customdata-2"></a> `customData?`                 | [`CustomDataType`](#customdatatype) \| `null`                   | -                                                                                                                                                                                                                                                                                      | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L15) |
| <a id="customercertificate"></a> `customerCertificate?` | [`CertificateHashDataType`](#certificatehashdatatype) \| `null` | -                                                                                                                                                                                                                                                                                      | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L16) |
| <a id="customeridentifier"></a> `customerIdentifier?`   | `string` \| `null`                                              | A (e.g. vendor specific) identifier of the customer this request refers to. This field contains a custom identifier other than IdToken and Certificate. One of the possible identifiers (customerIdentifier, customerIdToken or customerCertificate) should be in the request message. | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L39) |
| <a id="idtoken"></a> `idToken?`                         | [`IdTokenType`](#idtokentype) \| `null`                         | -                                                                                                                                                                                                                                                                                      | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L17) |
| <a id="report"></a> `report`                            | `boolean`                                                       | Flag indicating whether the Charging Station should return NotifyCustomerInformationRequest messages containing information about the customer referred to.                                                                                                                            | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L28) |
| <a id="requestid"></a> `requestId`                      | `number`                                                        | The Id of the request.                                                                                                                                                                                                                                                                 | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L23) |

---

### IdTokenType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:73](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L73)

Contains a case insensitive identifier to use for the authorization and the type of authorization to support multiple forms of identifiers.

#### Properties

| Property                                      | Type                                                                                    | Description                                                                                                    | Defined in                                                                                                                                                                                                                            |
| --------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="additionalinfo"></a> `additionalInfo?` | \| \[[`AdditionalInfoType`](#additionalinfotype), `...AdditionalInfoType[]`\] \| `null` | **Min Items** 1                                                                                                | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:78](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L78) |
| <a id="customdata-3"></a> `customData?`       | [`CustomDataType`](#customdatatype) \| `null`                                           | -                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:74](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L74) |
| <a id="idtoken-1"></a> `idToken`              | `string`                                                                                | IdToken is case insensitive. Might hold the hidden id of an RFID tag, but can for example also contain a UUID. | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:83](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L83) |
| <a id="type-1"></a> `type`                    | [`IdTokenEnumType`](../enums.md#idtokenenumtype)                                        | -                                                                                                              | [00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts:84](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/CustomerInformationRequest.ts#L84) |
