[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 01_Data/src/interfaces/dtos/TlsCertificatesRequest

# 01_Data/src/interfaces/dtos/TlsCertificatesRequest

## Classes

### TlsCertificatesRequest

Defined in: [01_Data/src/interfaces/dtos/TlsCertificatesRequest.ts:5](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/TlsCertificatesRequest.ts#L5)

#### Constructors

##### Constructor

```ts
new TlsCertificatesRequest(
   certificateChain,
   privateKey,
   rootCA?,
   subCAKey?): TlsCertificatesRequest;
```

Defined in: [01_Data/src/interfaces/dtos/TlsCertificatesRequest.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/TlsCertificatesRequest.ts#L12)

###### Parameters

| Parameter          | Type       |
| ------------------ | ---------- |
| `certificateChain` | `string`[] |
| `privateKey`       | `string`   |
| `rootCA?`          | `string`   |
| `subCAKey?`        | `string`   |

###### Returns

[`TlsCertificatesRequest`](#tlscertificatesrequest)

#### Properties

| Property                                         | Type       | Defined in                                                                                                                                                                                                      |
| ------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="certificatechain"></a> `certificateChain` | `string`[] | [01_Data/src/interfaces/dtos/TlsCertificatesRequest.ts:6](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/TlsCertificatesRequest.ts#L6)   |
| <a id="privatekey"></a> `privateKey`             | `string`   | [01_Data/src/interfaces/dtos/TlsCertificatesRequest.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/TlsCertificatesRequest.ts#L8)   |
| <a id="rootca"></a> `rootCA?`                    | `string`   | [01_Data/src/interfaces/dtos/TlsCertificatesRequest.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/TlsCertificatesRequest.ts#L9)   |
| <a id="subcakey"></a> `subCAKey?`                | `string`   | [01_Data/src/interfaces/dtos/TlsCertificatesRequest.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/TlsCertificatesRequest.ts#L10) |
