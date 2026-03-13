[**CitrineOS Core**](../../../../../../index.md)

---

[CitrineOS Core](../../../../../../index.md) / 00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest

# 00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest

## Interfaces

### CustomDataType

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest.ts:36](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest.ts#L36)

Represents OCPP CustomData.
Allows vendor-specific extension properties.

#### Indexable

```ts
[k: string]: unknown
```

#### Properties

| Property                         | Type     | Defined in                                                                                                                                                                                                                          |
| -------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="vendorid"></a> `vendorId` | `string` | [00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest.ts#L37) |

---

### GetDisplayMessagesRequest

Defined in: [00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest.ts#L14)

#### Extends

- [`OcppRequest`](../../../../../src.md#ocpprequest)

#### Properties

| Property                              | Type                                                                       | Description                                                                                                                                                                                                                              | Defined in                                                                                                                                                                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="customdata"></a> `customData?` | [`CustomDataType`](#customdatatype) \| `null`                              | -                                                                                                                                                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest.ts#L15) |
| <a id="id"></a> `id?`                 | \[`number`, `...number[]`\] \| `null`                                      | If provided the Charging Station shall return Display Messages of the given ids. This field SHALL NOT contain more ids than set in &lt;&lt;configkey-number-of-display-messages,NumberOfDisplayMessages.maxLimit&gt;&gt; **Min Items** 1 | [00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest.ts#L23) |
| <a id="priority"></a> `priority?`     | [`MessagePriorityEnumType`](../enums.md#messagepriorityenumtype) \| `null` | -                                                                                                                                                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest.ts#L29) |
| <a id="requestid"></a> `requestId`    | `number`                                                                   | The Id of this request.                                                                                                                                                                                                                  | [00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest.ts#L28) |
| <a id="state"></a> `state?`           | [`MessageStateEnumType`](../enums.md#messagestateenumtype) \| `null`       | -                                                                                                                                                                                                                                        | [00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/ocpp/model/2.0.1/types/GetDisplayMessagesRequest.ts#L30) |
