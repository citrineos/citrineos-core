[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/api/AsDataEndpoint

# 00_Base/src/interfaces/api/AsDataEndpoint

## Functions

### AsDataEndpoint()

```ts
function AsDataEndpoint(
  namespace,
  method,
  querySchema?,
  bodySchema?,
  paramSchema?,
  headerSchema?,
  responseSchema?,
  tags?,
  security?,
  description?,
): (target, propertyKey, descriptor) => void;
```

Defined in: [00_Base/src/interfaces/api/AsDataEndpoint.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/api/AsDataEndpoint.ts#L23)

Decorator for use in module API class to expose methods as REST data endpoints.

#### Parameters

| Parameter         | Type                                                                                                                                                                                                                                | Description                           |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `namespace`       | \| [`OCPP2_0_1_Namespace`](../../ocpp/persistence/namespace.md#ocpp2_0_1_namespace) \| [`OCPP1_6_Namespace`](../../ocpp/persistence/namespace.md#ocpp1_6_namespace) \| [`Namespace`](../../ocpp/persistence/namespace.md#namespace) | The namespace value.                  |
| `method`          | [`HttpMethod`](../api.md#httpmethod)                                                                                                                                                                                                | The HTTP method value.                |
| `querySchema?`    | `object`                                                                                                                                                                                                                            | The query schema value (optional).    |
| `bodySchema?`     | `object`                                                                                                                                                                                                                            | The body schema value (optional).     |
| `paramSchema?`    | `object`                                                                                                                                                                                                                            | The param schema value (optional).    |
| `headerSchema?`   | `object`                                                                                                                                                                                                                            | The header schema value (optional).   |
| `responseSchema?` | `object`                                                                                                                                                                                                                            | The response schema value (optional). |
| `tags?`           | `string` \| `string`[]                                                                                                                                                                                                              | The tags value (optional).            |
| `security?`       | `object`[]                                                                                                                                                                                                                          | The security value (optional).        |
| `description?`    | `string`                                                                                                                                                                                                                            | The description (optional).           |

#### Returns

- No return value.

```ts
(
   target,
   propertyKey,
   descriptor): void;
```

##### Parameters

| Parameter     | Type                 |
| ------------- | -------------------- |
| `target`      | `any`                |
| `propertyKey` | `string`             |
| `descriptor`  | `PropertyDescriptor` |

##### Returns

`void`
