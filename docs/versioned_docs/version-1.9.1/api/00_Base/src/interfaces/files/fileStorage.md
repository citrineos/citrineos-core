[**CitrineOS Core**](../../../../index.md)

---

[CitrineOS Core](../../../../index.md) / 00_Base/src/interfaces/files/fileStorage

# 00_Base/src/interfaces/files/fileStorage

## Interfaces

### IFileStorage

Defined in: [00_Base/src/interfaces/files/fileStorage.ts:7](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/files/fileStorage.ts#L7)

#### Extended by

- [`ConfigStore`](../../config/ConfigStore.md#configstore)

#### Methods

##### getFile()

```ts
getFile(id, filePath?): Promise<string | undefined>;
```

Defined in: [00_Base/src/interfaces/files/fileStorage.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/files/fileStorage.ts#L25)

###### Parameters

| Parameter   | Type     | Description                                                                      |
| ----------- | -------- | -------------------------------------------------------------------------------- |
| `id`        | `string` | The ID of the file                                                               |
| `filePath?` | `string` | The path of the file, if not included in the ID. Used as the bucket name for S3. |

###### Returns

`Promise`\<`string` \| `undefined`\>

The file content

##### saveFile()

```ts
saveFile(
   fileName,
   content,
filePath?): Promise<string>;
```

Defined in: [00_Base/src/interfaces/files/fileStorage.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/interfaces/files/fileStorage.ts#L16)

###### Parameters

| Parameter   | Type     | Description                                                           |
| ----------- | -------- | --------------------------------------------------------------------- |
| `fileName`  | `string` | Name of the file                                                      |
| `content`   | `Buffer` | File content                                                          |
| `filePath?` | `string` | The path of the file, if not in root. Used as the bucket name for S3. |

###### Returns

`Promise`\<`string`\>

The ID of the file
