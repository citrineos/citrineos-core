[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/modules/OCPPValidator

# 00_Base/src/interfaces/modules/OCPPValidator

## Classes

### OCPPValidator

Defined in: [00_Base/src/interfaces/modules/OCPPValidator.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/OCPPValidator.ts#L24)

#### Constructors

##### Constructor

```ts
new OCPPValidator(logger?, ajv?): OCPPValidator;
```

Defined in: [00_Base/src/interfaces/modules/OCPPValidator.ts:28](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/OCPPValidator.ts#L28)

###### Parameters

| Parameter | Type                  |
| --------- | --------------------- |
| `logger?` | `Logger`\<`ILogObj`\> |
| `ajv?`    | `Ajv`                 |

###### Returns

[`OCPPValidator`](#ocppvalidator)

#### Properties

| Property                       | Modifier    | Type                  | Defined in                                                                                                                                                                                          |
| ------------------------------ | ----------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="_ajv"></a> `_ajv`       | `protected` | `Ajv`                 | [00_Base/src/interfaces/modules/OCPPValidator.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/OCPPValidator.ts#L25) |
| <a id="_logger"></a> `_logger` | `readonly`  | `Logger`\<`ILogObj`\> | [00_Base/src/interfaces/modules/OCPPValidator.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/OCPPValidator.ts#L26) |

#### Methods

##### fixRefs()

```ts
private fixRefs(schema): void;
```

Defined in: [00_Base/src/interfaces/modules/OCPPValidator.ts:275](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/OCPPValidator.ts#L275)

###### Parameters

| Parameter | Type  |
| --------- | ----- |
| `schema`  | `any` |

###### Returns

`void`

##### removeNulls()

```ts
private removeNulls<T>(obj): T;
```

Defined in: [00_Base/src/interfaces/modules/OCPPValidator.ts:259](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/OCPPValidator.ts#L259)

###### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

###### Parameters

| Parameter | Type |
| --------- | ---- |
| `obj`     | `T`  |

###### Returns

`T`

##### sanitizeOCPPPayload()

```ts
sanitizeOCPPPayload<T>(message): T;
```

Defined in: [00_Base/src/interfaces/modules/OCPPValidator.ts:251](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/OCPPValidator.ts#L251)

Prepares an OCPP Payload for sending by removing any null values, as OCPP does not allow null values in its messages.

###### Type Parameters

| Type Parameter                                                                                                  |
| --------------------------------------------------------------------------------------------------------------- |
| `T` _extends_ \| [`OcppRequest`](../../../src.md#ocpprequest) \| [`OcppResponse`](../../../src.md#ocppresponse) |

###### Parameters

| Parameter | Type | Description                |
| --------- | ---- | -------------------------- |
| `message` | `T`  | OCPP Payload, as an object |

###### Returns

`T`

The sanitized OCPP Payload, with null values removed

##### validateOCPPRequest()

```ts
validateOCPPRequest(
   action,
   payload,
   protocol): object;
```

Defined in: [00_Base/src/interfaces/modules/OCPPValidator.ts:130](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/OCPPValidator.ts#L130)

Validates an OCPP Request object against its schema.

###### Parameters

| Parameter  | Type                                                   | Description                          |
| ---------- | ------------------------------------------------------ | ------------------------------------ |
| `action`   | [`CallAction`](../../ocpp/rpc/message.md#callaction)   | The original CallAction.             |
| `payload`  | [`OcppRequest`](../../../src.md#ocpprequest)           | The OCPP Request object to validate. |
| `protocol` | [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion) | The OCPP protocol version.           |

###### Returns

`object`

- Returns true if the OCPP Request object is valid, false otherwise.

| Name      | Type                                                                             | Defined in                                                                                                                                                                                            |
| --------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `errors?` | \| `ErrorObject`\<`string`, `Record`\<`string`, `any`\>, `unknown`\>[] \| `null` | [00_Base/src/interfaces/modules/OCPPValidator.ts:134](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/OCPPValidator.ts#L134) |
| `isValid` | `boolean`                                                                        | [00_Base/src/interfaces/modules/OCPPValidator.ts:134](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/OCPPValidator.ts#L134) |

##### validateOCPPResponse()

```ts
validateOCPPResponse(
   action,
   payload,
   protocol): object;
```

Defined in: [00_Base/src/interfaces/modules/OCPPValidator.ts:202](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/OCPPValidator.ts#L202)

Validates an OCPP Response against its schema.

###### Parameters

| Parameter  | Type                                                                                                    | Description                          |
| ---------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| `action`   | [`CallAction`](../../ocpp/rpc/message.md#callaction)                                                    | The original CallAction.             |
| `payload`  | \| [`OcppResponse`](../../../src.md#ocppresponse) \| [`OcppError`](../../ocpp/rpc/message.md#ocpperror) | The OCPPResponse object to validate. |
| `protocol` | [`OCPPVersion`](../../ocpp/rpc/message.md#ocppversion)                                                  | The OCPP protocol version.           |

###### Returns

`object`

- Returns true if the OCPPResponse object is valid, false otherwise.

| Name      | Type                                                                             | Defined in                                                                                                                                                                                            |
| --------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `errors?` | \| `ErrorObject`\<`string`, `Record`\<`string`, `any`\>, `unknown`\>[] \| `null` | [00_Base/src/interfaces/modules/OCPPValidator.ts:206](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/OCPPValidator.ts#L206) |
| `isValid` | `boolean`                                                                        | [00_Base/src/interfaces/modules/OCPPValidator.ts:206](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/OCPPValidator.ts#L206) |

##### addFormats()

```ts
static addFormats(ajv): void;
```

Defined in: [00_Base/src/interfaces/modules/OCPPValidator.ts:115](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/OCPPValidator.ts#L115)

Adds format validation for date-time and URI formats to an Ajv instance.

###### Parameters

| Parameter | Type  | Description                        |
| --------- | ----- | ---------------------------------- |
| `ajv`     | `Ajv` | The Ajv instance to add formats to |

###### Returns

`void`

##### addOcppKeywords()

```ts
static addOcppKeywords(ajv): void;
```

Defined in: [00_Base/src/interfaces/modules/OCPPValidator.ts:92](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/OCPPValidator.ts#L92)

Adds custom keywords for OCPP schema metadata to an Ajv instance.
These keywords are used in OCPP JSON schemas but don't affect validation.

###### Parameters

| Parameter | Type  | Description                         |
| --------- | ----- | ----------------------------------- |
| `ajv`     | `Ajv` | The Ajv instance to add keywords to |

###### Returns

`void`

##### createServerAjvInstance()

```ts
static createServerAjvInstance(ajv?): Ajv;
```

Defined in: [00_Base/src/interfaces/modules/OCPPValidator.ts:43](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/OCPPValidator.ts#L43)

Creates an Ajv instance configured for Fastify HTTP schema compilation.
Enables type coercion since HTTP query/path params arrive as strings,
and does not include OCPP-specific keywords.

###### Parameters

| Parameter | Type  | Description                                                         |
| --------- | ----- | ------------------------------------------------------------------- |
| `ajv?`    | `Ajv` | Optional existing Ajv instance to use instead of creating a new one |

###### Returns

`Ajv`

Configured Ajv instance for Fastify schema compilation

##### createValidatorAjvInstance()

```ts
static createValidatorAjvInstance(ajv?): Ajv;
```

Defined in: [00_Base/src/interfaces/modules/OCPPValidator.ts:67](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/modules/OCPPValidator.ts#L67)

Creates an Ajv instance configured for OCPP message validation.
Does not coerce types since OCPP messages arrive as parsed JSON with correct types.
Includes OCPP-specific schema keywords and strict number/required validation.

###### Parameters

| Parameter | Type  | Description                                                         |
| --------- | ----- | ------------------------------------------------------------------- |
| `ajv?`    | `Ajv` | Optional existing Ajv instance to use instead of creating a new one |

###### Returns

`Ajv`

Configured Ajv instance for OCPP message validation
