[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 02_Util/src/certificate/client/interface

# 02_Util/src/certificate/client/interface

## Interfaces

### IChargingStationCertificateAuthorityClient

Defined in: [02_Util/src/certificate/client/interface.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/client/interface.ts#L15)

#### Methods

##### getCertificateChain()

```ts
getCertificateChain(csrString): Promise<string>;
```

Defined in: [02_Util/src/certificate/client/interface.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/client/interface.ts#L17)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `csrString` | `string` |

###### Returns

`Promise`\<`string`\>

##### getRootCACertificate()

```ts
getRootCACertificate(): Promise<string>;
```

Defined in: [02_Util/src/certificate/client/interface.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/client/interface.ts#L16)

###### Returns

`Promise`\<`string`\>

##### signCertificateByExternalCA()

```ts
signCertificateByExternalCA(csrString): Promise<string>;
```

Defined in: [02_Util/src/certificate/client/interface.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/client/interface.ts#L18)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `csrString` | `string` |

###### Returns

`Promise`\<`string`\>

##### updateCertificateChainKeyMap()

```ts
updateCertificateChainKeyMap(
   serverId,
   certificateChain,
   privateKey): void;
```

Defined in: [02_Util/src/certificate/client/interface.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/client/interface.ts#L19)

###### Parameters

| Parameter          | Type     |
| ------------------ | -------- |
| `serverId`         | `string` |
| `certificateChain` | `string` |
| `privateKey`       | `string` |

###### Returns

`void`

---

### IV2GCertificateAuthorityClient

Defined in: [02_Util/src/certificate/client/interface.ts:5](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/client/interface.ts#L5)

#### Methods

##### getCACertificates()

```ts
getCACertificates(): Promise<string>;
```

Defined in: [02_Util/src/certificate/client/interface.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/client/interface.ts#L7)

###### Returns

`Promise`\<`string`\>

##### getRootCertificates()

```ts
getRootCertificates(): Promise<string[]>;
```

Defined in: [02_Util/src/certificate/client/interface.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/client/interface.ts#L12)

###### Returns

`Promise`\<`string`[]\>

##### getSignedCertificate()

```ts
getSignedCertificate(csrString): Promise<string>;
```

Defined in: [02_Util/src/certificate/client/interface.ts:6](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/client/interface.ts#L6)

###### Parameters

| Parameter   | Type     |
| ----------- | -------- |
| `csrString` | `string` |

###### Returns

`Promise`\<`string`\>

##### getSignedContractData()

```ts
getSignedContractData(certificateInstallationReq, xsdMsgDefNamespace): Promise<string>;
```

Defined in: [02_Util/src/certificate/client/interface.ts:8](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/02_Util/src/certificate/client/interface.ts#L8)

###### Parameters

| Parameter                    | Type     |
| ---------------------------- | -------- |
| `certificateInstallationReq` | `string` |
| `xsdMsgDefNamespace`         | `string` |

###### Returns

`Promise`\<`string`\>
