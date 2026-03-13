[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/api/MessageQuerystring

# 00_Base/src/interfaces/api/MessageQuerystring

## Interfaces

### IMessageQuerystring

Defined in: [00_Base/src/interfaces/api/MessageQuerystring.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageQuerystring.ts#L10)

The message querystring interface, used for every OCPP message endpoint to validate query parameters.

#### Properties

| Property                                | Type                   | Defined in                                                                                                                                                                                            |
| --------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="callbackurl"></a> `callbackUrl?` | `string`               | [00_Base/src/interfaces/api/MessageQuerystring.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageQuerystring.ts#L13) |
| <a id="identifier"></a> `identifier`    | `string` \| `string`[] | [00_Base/src/interfaces/api/MessageQuerystring.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageQuerystring.ts#L11) |
| <a id="tenantid"></a> `tenantId?`       | `number`               | [00_Base/src/interfaces/api/MessageQuerystring.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageQuerystring.ts#L12) |

## Variables

### IMessageQuerystringSchema

```ts
const IMessageQuerystringSchema: object;
```

Defined in: [00_Base/src/interfaces/api/MessageQuerystring.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageQuerystring.ts#L19)

This message querystring schema describes the [IMessageQuerystring](#imessagequerystring) interface.

#### Type Declaration

| Name                                          | Type                                                                                                                | Default value          | Defined in                                                                                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="property-id"></a> `$id`                | `string`                                                                                                            | `'MessageQuerystring'` | [00_Base/src/interfaces/api/MessageQuerystring.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageQuerystring.ts#L20) |
| <a id="property-properties"></a> `properties` | `object`                                                                                                            | -                      | [00_Base/src/interfaces/api/MessageQuerystring.ts:22](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageQuerystring.ts#L22) |
| `properties.callbackUrl`                      | `object`                                                                                                            | -                      | [00_Base/src/interfaces/api/MessageQuerystring.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageQuerystring.ts#L33) |
| `properties.callbackUrl.type`                 | `string`                                                                                                            | `'string'`             | [00_Base/src/interfaces/api/MessageQuerystring.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageQuerystring.ts#L33) |
| `properties.identifier`                       | `object`                                                                                                            | -                      | [00_Base/src/interfaces/api/MessageQuerystring.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageQuerystring.ts#L23) |
| `properties.identifier.anyOf`                 | ( \| \{ `items?`: `undefined`; `type`: `string`; \} \| \{ `items`: \{ `type`: `string`; \}; `type`: `string`; \})[] | -                      | [00_Base/src/interfaces/api/MessageQuerystring.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageQuerystring.ts#L24) |
| `properties.tenantId`                         | `object`                                                                                                            | -                      | [00_Base/src/interfaces/api/MessageQuerystring.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageQuerystring.ts#L32) |
| `properties.tenantId.default`                 | `number`                                                                                                            | `DEFAULT_TENANT_ID`    | [00_Base/src/interfaces/api/MessageQuerystring.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageQuerystring.ts#L32) |
| `properties.tenantId.type`                    | `string`                                                                                                            | `'number'`             | [00_Base/src/interfaces/api/MessageQuerystring.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageQuerystring.ts#L32) |
| <a id="property-required"></a> `required`     | `string`[]                                                                                                          | -                      | [00_Base/src/interfaces/api/MessageQuerystring.ts:35](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageQuerystring.ts#L35) |
| <a id="property-type"></a> `type`             | `string`                                                                                                            | `'object'`             | [00_Base/src/interfaces/api/MessageQuerystring.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageQuerystring.ts#L21) |
