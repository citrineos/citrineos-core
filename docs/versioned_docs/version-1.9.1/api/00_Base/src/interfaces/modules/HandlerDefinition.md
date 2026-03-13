[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/modules/HandlerDefinition

# 00_Base/src/interfaces/modules/HandlerDefinition

## Interfaces

### IHandlerDefinition

Defined in: [00_Base/src/interfaces/modules/HandlerDefinition.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/HandlerDefinition.ts#L11)

Interface for usage in AsHandler decorator.

#### Properties

| Property                             | Type                                                   | Defined in                                                                                                                                                                                                  |
| ------------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="action"></a> `action`         | [`CallAction`](../../ocpp/rpc/message.md#callaction)   | [00_Base/src/interfaces/modules/HandlerDefinition.ts:13](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/HandlerDefinition.ts#L13) |
| <a id="method"></a> `method`         | (...`args`) => `any`                                   | [00_Base/src/interfaces/modules/HandlerDefinition.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/HandlerDefinition.ts#L14) |
| <a id="methodname"></a> `methodName` | `string`                                               | [00_Base/src/interfaces/modules/HandlerDefinition.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/HandlerDefinition.ts#L15) |
| <a id="protocol"></a> `protocol`     | [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion) | [00_Base/src/interfaces/modules/HandlerDefinition.ts:12](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/HandlerDefinition.ts#L12) |
