[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 01_Data/src/interfaces/dtos/InstallRootCertificateRequest

# 01_Data/src/interfaces/dtos/InstallRootCertificateRequest

## Classes

### InstallRootCertificateRequest

Defined in: [01_Data/src/interfaces/dtos/InstallRootCertificateRequest.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/InstallRootCertificateRequest.ts#L7)

#### Constructors

##### Constructor

```ts
new InstallRootCertificateRequest(
   stationId,
   tenantId,
   certificateType,
   callbackUrl?,
   fileId?): InstallRootCertificateRequest;
```

Defined in: [01_Data/src/interfaces/dtos/InstallRootCertificateRequest.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/InstallRootCertificateRequest.ts#L17)

###### Parameters

| Parameter         | Type                            |
| ----------------- | ------------------------------- |
| `stationId`       | `string`                        |
| `tenantId`        | `number`                        |
| `certificateType` | `InstallCertificateUseEnumType` |
| `callbackUrl?`    | `string`                        |
| `fileId?`         | `string`                        |

###### Returns

[`InstallRootCertificateRequest`](#installrootcertificaterequest)

#### Properties

| Property                                       | Type                            | Defined in                                                                                                                                                                                                                    |
| ---------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="callbackurl"></a> `callbackUrl?`        | `string`                        | [01_Data/src/interfaces/dtos/InstallRootCertificateRequest.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/InstallRootCertificateRequest.ts#L12) |
| <a id="certificatetype"></a> `certificateType` | `InstallCertificateUseEnumType` | [01_Data/src/interfaces/dtos/InstallRootCertificateRequest.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/InstallRootCertificateRequest.ts#L10) |
| <a id="fileid"></a> `fileId?`                  | `string`                        | [01_Data/src/interfaces/dtos/InstallRootCertificateRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/InstallRootCertificateRequest.ts#L15) |
| <a id="stationid"></a> `stationId`             | `string`                        | [01_Data/src/interfaces/dtos/InstallRootCertificateRequest.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/InstallRootCertificateRequest.ts#L9)   |
| <a id="tenantid"></a> `tenantId`               | `number`                        | [01_Data/src/interfaces/dtos/InstallRootCertificateRequest.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/01_Data/src/interfaces/dtos/InstallRootCertificateRequest.ts#L11) |
