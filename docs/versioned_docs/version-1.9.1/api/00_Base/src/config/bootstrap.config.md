[**CitrineOS Core**](../../../index.md)

---

[CitrineOS Core](../../../index.md) / 00_Base/src/config/bootstrap.config

# 00_Base/src/config/bootstrap.config

## Type Aliases

### BootstrapConfig

```ts
type BootstrapConfig = z.infer<typeof bootstrapConfigSchema>;
```

Defined in: [00_Base/src/config/bootstrap.config.ts:82](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L82)

## Variables

### bootstrapConfigSchema

```ts
const bootstrapConfigSchema: ZodObject<
  {
    configDir: ZodOptional<ZodString>;
    configFileName: ZodDefault<ZodString>;
    database: ZodObject<
      {
        alter: ZodDefault<ZodBoolean>;
        database: ZodDefault<ZodString>;
        dialect: ZodDefault<ZodString>;
        force: ZodDefault<ZodBoolean>;
        host: ZodDefault<ZodString>;
        maxRetries: ZodDefault<ZodNumber>;
        password: ZodDefault<ZodString>;
        pool: ZodOptional<
          ZodObject<
            {
              acquire: ZodOptional<ZodNumber>;
              idle: ZodOptional<ZodNumber>;
              max: ZodOptional<ZodNumber>;
              min: ZodOptional<ZodNumber>;
            },
            $strip
          >
        >;
        port: ZodDefault<ZodNumber>;
        retryDelay: ZodDefault<ZodNumber>;
        sync: ZodDefault<ZodBoolean>;
        username: ZodDefault<ZodString>;
      },
      $strip
    >;
    fileAccess: ZodObject<
      {
        gcp: ZodOptional<
          ZodObject<
            {
              credentials: ZodOptional<ZodObject<{}, $strip>>;
              projectId: ZodString;
            },
            $strip
          >
        >;
        local: ZodOptional<
          ZodObject<
            {
              defaultFilePath: ZodDefault<ZodString>;
            },
            $strip
          >
        >;
        s3: ZodOptional<
          ZodObject<
            {
              accessKeyId: ZodOptional<ZodString>;
              defaultBucketName: ZodDefault<ZodString>;
              endpoint: ZodOptional<ZodString>;
              region: ZodOptional<ZodString>;
              s3ForcePathStyle: ZodDefault<ZodBoolean>;
              secretAccessKey: ZodOptional<ZodString>;
            },
            $strip
          >
        >;
        type: ZodEnum<{
          gcp: 'gcp';
          local: 'local';
          s3: 's3';
        }>;
      },
      $strip
    >;
  },
  $strip
>;
```

Defined in: [00_Base/src/config/bootstrap.config.ts:9](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L9)

## Functions

### loadBootstrapConfig()

```ts
function loadBootstrapConfig(): object;
```

Defined in: [00_Base/src/config/bootstrap.config.ts:106](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L106)

Load bootstrap configuration from environment variables

#### Returns

`object`

| Name                               | Type                           | Defined in                                                                                                                                                                        |
| ---------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `configDir?`                       | `string`                       | [00_Base/src/config/bootstrap.config.ts:11](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L11) |
| `configFileName`                   | `string`                       | [00_Base/src/config/bootstrap.config.ts:10](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L10) |
| `database`                         | `object`                       | [00_Base/src/config/bootstrap.config.ts:14](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L14) |
| `database.alter`                   | `boolean`                      | [00_Base/src/config/bootstrap.config.ts:30](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L30) |
| `database.database`                | `string`                       | [00_Base/src/config/bootstrap.config.ts:17](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L17) |
| `database.dialect`                 | `string`                       | [00_Base/src/config/bootstrap.config.ts:18](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L18) |
| `database.force`                   | `boolean`                      | [00_Base/src/config/bootstrap.config.ts:31](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L31) |
| `database.host`                    | `string`                       | [00_Base/src/config/bootstrap.config.ts:15](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L15) |
| `database.maxRetries`              | `number`                       | [00_Base/src/config/bootstrap.config.ts:32](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L32) |
| `database.password`                | `string`                       | [00_Base/src/config/bootstrap.config.ts:20](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L20) |
| `database.pool?`                   | `object`                       | [00_Base/src/config/bootstrap.config.ts:21](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L21) |
| `database.pool.acquire?`           | `number`                       | [00_Base/src/config/bootstrap.config.ts:25](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L25) |
| `database.pool.idle?`              | `number`                       | [00_Base/src/config/bootstrap.config.ts:26](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L26) |
| `database.pool.max?`               | `number`                       | [00_Base/src/config/bootstrap.config.ts:23](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L23) |
| `database.pool.min?`               | `number`                       | [00_Base/src/config/bootstrap.config.ts:24](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L24) |
| `database.port`                    | `number`                       | [00_Base/src/config/bootstrap.config.ts:16](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L16) |
| `database.retryDelay`              | `number`                       | [00_Base/src/config/bootstrap.config.ts:33](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L33) |
| `database.sync`                    | `boolean`                      | [00_Base/src/config/bootstrap.config.ts:29](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L29) |
| `database.username`                | `string`                       | [00_Base/src/config/bootstrap.config.ts:19](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L19) |
| `fileAccess`                       | `object`                       | [00_Base/src/config/bootstrap.config.ts:37](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L37) |
| `fileAccess.gcp?`                  | `object`                       | [00_Base/src/config/bootstrap.config.ts:55](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L55) |
| `fileAccess.gcp.credentials?`      | `Record`\<`string`, `never`\>  | [00_Base/src/config/bootstrap.config.ts:58](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L58) |
| `fileAccess.gcp.projectId`         | `string`                       | [00_Base/src/config/bootstrap.config.ts:57](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L57) |
| `fileAccess.local?`                | `object`                       | [00_Base/src/config/bootstrap.config.ts:40](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L40) |
| `fileAccess.local.defaultFilePath` | `string`                       | [00_Base/src/config/bootstrap.config.ts:42](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L42) |
| `fileAccess.s3?`                   | `object`                       | [00_Base/src/config/bootstrap.config.ts:45](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L45) |
| `fileAccess.s3.accessKeyId?`       | `string`                       | [00_Base/src/config/bootstrap.config.ts:51](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L51) |
| `fileAccess.s3.defaultBucketName`  | `string`                       | [00_Base/src/config/bootstrap.config.ts:49](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L49) |
| `fileAccess.s3.endpoint?`          | `string`                       | [00_Base/src/config/bootstrap.config.ts:48](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L48) |
| `fileAccess.s3.region?`            | `string`                       | [00_Base/src/config/bootstrap.config.ts:47](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L47) |
| `fileAccess.s3.s3ForcePathStyle`   | `boolean`                      | [00_Base/src/config/bootstrap.config.ts:50](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L50) |
| `fileAccess.s3.secretAccessKey?`   | `string`                       | [00_Base/src/config/bootstrap.config.ts:52](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L52) |
| `fileAccess.type`                  | `"local"` \| `"s3"` \| `"gcp"` | [00_Base/src/config/bootstrap.config.ts:39](https://github.com/citrineos/citrineos-core/blob/def27d2c18695e68d1cb53d23c8d4cfb26151d5f/00_Base/src/config/bootstrap.config.ts#L39) |
