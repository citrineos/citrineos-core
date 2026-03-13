[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/api/MessageEndpointDefinition

# 00_Base/src/interfaces/api/MessageEndpointDefinition

## Interfaces

### IMessageEndpointDefinition

Defined in: [00_Base/src/interfaces/api/MessageEndpointDefinition.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageEndpointDefinition.ts#L10)

Interface for usage in AsMessageEndpoint decorator.

#### Properties

| Property                                                  | Type                                                 | Defined in                                                                                                                                                                                                          |
| --------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="action"></a> `action`                              | [`CallAction`](../../ocpp/rpc/message.md#callaction) | [00_Base/src/interfaces/api/MessageEndpointDefinition.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageEndpointDefinition.ts#L11) |
| <a id="bodyschema"></a> `bodySchema`                      | `object`                                             | [00_Base/src/interfaces/api/MessageEndpointDefinition.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageEndpointDefinition.ts#L14) |
| <a id="method"></a> `method`                              | (...`args`) => `any`                                 | [00_Base/src/interfaces/api/MessageEndpointDefinition.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageEndpointDefinition.ts#L12) |
| <a id="methodname"></a> `methodName`                      | `string`                                             | [00_Base/src/interfaces/api/MessageEndpointDefinition.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageEndpointDefinition.ts#L13) |
| <a id="optionalquerystrings"></a> `optionalQuerystrings?` | `Record`\<`string`, `any`\>                          | [00_Base/src/interfaces/api/MessageEndpointDefinition.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/MessageEndpointDefinition.ts#L15) |
