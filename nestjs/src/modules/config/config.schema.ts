import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import * as os from 'os';
import { OCPP_CallAction } from '@ocpp/call-action';
import { OCPPVersion } from '@ocpp/ocpp-version';
import { RegistrationStatusEnumType } from '@enums/registration-status.enum';

// ─── Security ────────────────────────────────────────────────────────────────

export enum SecurityProfile {
  NoSecurity = 0,
  BasicAuth = 1,
  BasicAuthTls = 2,
  MutualTls = 3,
}

// ─── util.networkConnection ───────────────────────────────────────────────────

/**
 * WebSocketServerConfig config slice — class-validator-shaped data container.
 */
export class WebSocketServerConfig {
  @IsString()
  id: string = 'ws-default';

  @IsString()
  @IsOptional()
  host?: string = '0.0.0.0';

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value != null ? parseInt(value, 10) : undefined))
  port?: number = 8081;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value != null ? parseInt(value, 10) : undefined))
  pingInterval?: number = 60;

  @IsArray()
  @IsEnum(OCPPVersion, { each: true })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((s: string) => s.trim()) : value,
  )
  protocols?: OCPPVersion[] = [OCPPVersion.OCPP2_0_1];

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value != null ? parseInt(value, 10) : undefined))
  securityProfile?: SecurityProfile = SecurityProfile.NoSecurity;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value !== false && value !== 'false')
  allowUnknownChargingStations?: boolean = true;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  ignoreAuthenticationHeaders?: boolean = false;

  @IsOptional()
  @IsObject()
  tenantPathMapping?: Record<string, number>;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  dynamicTenantResolution?: boolean = false;

  @IsEnum(OCPPVersion)
  @IsOptional()
  forceProtocol?: OCPPVersion;

  // Exactly one of tenantId or dynamicTenantResolution must be set.
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => (value != null ? parseInt(value, 10) : undefined))
  tenantId?: number;

  // TLS file paths (required for securityProfile >= 2)
  @IsString() @IsOptional() tlsKeyFilePath?: string;
  @IsString() @IsOptional() tlsCertificateChainFilePath?: string;
  @IsString() @IsOptional() mtlsCertificateAuthorityKeyFilePath?: string;
  @IsString() @IsOptional() rootCACertificateFilePath?: string;
}

/**
 * NetworkConnectionConfig config slice — class-validator-shaped data container.
 */
export class NetworkConnectionConfig {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WebSocketServerConfig)
  websocketServers: WebSocketServerConfig[] = [
    Object.assign(new WebSocketServerConfig(), {
      id: '0',
      host: '0.0.0.0',
      port: 8081,
      protocols: [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP1_6],
      securityProfile: SecurityProfile.NoSecurity,
      allowUnknownChargingStations: true,
      pingInterval: 60,
      tenantId: 1,
      dynamicTenantResolution: false,
    }),
  ];
}

// ─── util.messageBroker ───────────────────────────────────────────────────────

/**
 * AmqpConfig config slice — class-validator-shaped data container.
 */
export class AmqpConfig {
  @IsString()
  url: string = 'amqp://guest:guest@localhost:5672';

  @IsString()
  exchange: string = 'citrineos';

  @IsString()
  @IsOptional()
  instanceIdentifier?: string = `router-${os.hostname()}-${process.pid}`;
}

/**
 * MessageBrokerConfig config slice — class-validator-shaped data container.
 */
export class MessageBrokerConfig {
  @IsOptional()
  @ValidateNested()
  @Type(() => AmqpConfig)
  amqp?: AmqpConfig = new AmqpConfig();
}

// ─── util.cache ───────────────────────────────────────────────────────────────

/**
 * RedisConfig config slice — class-validator-shaped data container.
 */
export class RedisConfig {
  @IsString() @IsOptional() host?: string;
  @IsNumber() @IsOptional() port?: number;
  @IsString() @IsOptional() url?: string;
}

/**
 * CacheConfig config slice — class-validator-shaped data container.
 */
export class CacheConfig {
  @IsBoolean()
  @IsOptional()
  memory?: boolean = true;

  @IsOptional()
  @ValidateNested()
  @Type(() => RedisConfig)
  redis?: RedisConfig;
}

// ─── util.authProvider ────────────────────────────────────────────────────────

/**
 * OidcConfig config slice — class-validator-shaped data container.
 */
export class OidcConfig {
  @IsString() jwksUri: string;
  @IsString() issuer: string;
  @IsString() audience: string;
  @IsNumber() @IsOptional() cacheTime?: number;
  @IsBoolean() @IsOptional() rateLimit?: boolean;
}

/**
 * AuthProviderConfig config slice — class-validator-shaped data container.
 */
export class AuthProviderConfig {
  @IsOptional()
  @ValidateNested()
  @Type(() => OidcConfig)
  oidc?: OidcConfig;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  localByPass?: boolean = true;
}

// ─── util.swagger ─────────────────────────────────────────────────────────────

/**
 * SwaggerConfig config slice — class-validator-shaped data container.
 */
export class SwaggerConfig {
  @IsString()
  @IsOptional()
  path?: string = '/docs';

  @IsString()
  @IsOptional()
  logoPath?: string;

  @IsBoolean()
  @IsOptional()
  exposeData?: boolean = true;

  @IsBoolean()
  @IsOptional()
  exposeMessage?: boolean = true;
}

// ─── util.certificateAuthority ────────────────────────────────────────────────

/**
 * HubjectConfig config slice — class-validator-shaped data container.
 */
export class HubjectConfig {
  @IsString() baseUrl: string = 'https://open.plugncharge-test.hubject.com';
  @IsString() tokenUrl: string =
    'https://hubject.stoplight.io/api/v1/projects/cHJqOjk0NTg5/nodes/6bb8b3bc79c2e-authorization-token';
  @IsString() clientId: string = 'YOUR_CLIENT_ID';
  @IsString() clientSecret: string = 'YOUR_CLIENT_SECRET';
}

/**
 * V2gCaConfig config slice — class-validator-shaped data container.
 */
export class V2gCaConfig {
  @IsEnum(['hubject'])
  name: 'hubject' = 'hubject';

  @IsOptional()
  @ValidateNested()
  @Type(() => HubjectConfig)
  hubject?: HubjectConfig;
}

/**
 * AcmeConfig config slice — class-validator-shaped data container.
 */
export class AcmeConfig {
  @IsEnum(['staging', 'production'])
  env: 'staging' | 'production' = 'staging';

  @IsString() accountKeyFilePath: string = '';
  @IsString() email: string = '';

  /**
   * Directory served at `/.well-known/acme-challenge/{token}` for HTTP-01
   * challenge token files. Must be writable and reachable by the ACME
   * server. Defaults to legacy-compatible path.
   */
  @IsString() challengeDirectory: string =
    '/usr/local/apps/citrineos/Server/src/assets/.well-known/acme-challenge';
}

export class ChargingStationCaConfig {
  @IsEnum(['acme'])
  name: 'acme' = 'acme';

  @IsOptional()
  @ValidateNested()
  @Type(() => AcmeConfig)
  acme?: AcmeConfig;
}

/**
 * CertificateAuthorityConfig config slice — class-validator-shaped data container.
 */
export class CertificateAuthorityConfig {
  @ValidateNested()
  @Type(() => V2gCaConfig)
  v2gCA: V2gCaConfig = new V2gCaConfig();

  @ValidateNested()
  @Type(() => ChargingStationCaConfig)
  chargingStationCA: ChargingStationCaConfig = new ChargingStationCaConfig();
}

// ─── util ─────────────────────────────────────────────────────────────────────

/**
 * OpenTelemetry tracing config. Disabled by default; when `enabled=true`
 * the bootstrap installs a tracer provider that exports OTLP spans to
 * `endpoint` (e.g. `http://localhost:4318/v1/traces`).
 */
export class TelemetryConfig {
  @IsBoolean() enabled: boolean = false;
  @IsString() endpoint: string = 'http://localhost:4318/v1/traces';
  @IsString() serviceName: string = 'citrineos-nestjs';
}

export class UtilConfig {
  @ValidateNested()
  @Type(() => CacheConfig)
  cache: CacheConfig = new CacheConfig();

  @ValidateNested()
  @Type(() => MessageBrokerConfig)
  messageBroker: MessageBrokerConfig = new MessageBrokerConfig();

  @ValidateNested()
  @Type(() => AuthProviderConfig)
  authProvider: AuthProviderConfig = new AuthProviderConfig();

  @IsOptional()
  @ValidateNested()
  @Type(() => SwaggerConfig)
  swagger?: SwaggerConfig = new SwaggerConfig();

  @ValidateNested()
  @Type(() => NetworkConnectionConfig)
  networkConnection: NetworkConnectionConfig = new NetworkConnectionConfig();

  @IsOptional()
  @ValidateNested()
  @Type(() => CertificateAuthorityConfig)
  certificateAuthority?: CertificateAuthorityConfig;

  @IsOptional()
  @ValidateNested()
  @Type(() => TelemetryConfig)
  telemetry?: TelemetryConfig;
}

// ─── modules — base ───────────────────────────────────────────────────────────

/**
 * BaseModuleConfig config slice — class-validator-shaped data container.
 */
export class BaseModuleConfig {
  @IsString()
  @IsOptional()
  endpointPrefix?: string;

  @IsString()
  @IsOptional()
  host?: string;

  @IsNumber()
  @IsOptional()
  port?: number;

  @IsArray()
  @IsEnum(OCPP_CallAction, { each: true })
  requests: OCPP_CallAction[] = [];

  @IsArray()
  @IsEnum(OCPP_CallAction, { each: true })
  responses: OCPP_CallAction[] = [];
}

// ─── modules.configuration ────────────────────────────────────────────────────

/**
 * Ocpp2xConfigModuleConfig config slice — class-validator-shaped data container.
 */
export class Ocpp2xConfigModuleConfig {
  @IsEnum(RegistrationStatusEnumType)
  @IsOptional()
  unknownChargerStatus?: RegistrationStatusEnumType = RegistrationStatusEnumType.Accepted;

  @IsBoolean()
  @IsOptional()
  getBaseReportOnPending?: boolean = true;

  @IsBoolean()
  @IsOptional()
  bootWithRejectedVariables?: boolean = true;

  @IsBoolean()
  @IsOptional()
  autoAccept?: boolean = true;
}

/**
 * Ocpp16ConfigModuleConfig config slice — class-validator-shaped data container.
 */
export class Ocpp16ConfigModuleConfig {
  @IsString()
  @IsOptional()
  unknownChargerStatus?: 'Accepted' | 'Pending' | 'Rejected' = 'Accepted';
}

/**
 * DataTransfer policy. The legacy server treats any vendorId not present in
 * `allowedVendorIds` as `UnknownVendorId`. An empty list (the default)
 * accepts any vendorId — matches legacy "no allowlist configured" behavior.
 */
export class DataTransferConfig {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedVendorIds?: string[] = [];
}

export class ConfigurationModuleConfig extends BaseModuleConfig {
  @IsNumber()
  heartbeatInterval: number = 60;

  @IsNumber()
  bootRetryInterval: number = 15;

  @IsOptional()
  @ValidateNested()
  @Type(() => DataTransferConfig)
  dataTransfer?: DataTransferConfig = new DataTransferConfig();

  @IsOptional()
  @ValidateNested()
  @Type(() => Ocpp2xConfigModuleConfig)
  ocpp2_0_1?: Ocpp2xConfigModuleConfig = new Ocpp2xConfigModuleConfig();

  @IsOptional()
  @ValidateNested()
  @Type(() => Ocpp2xConfigModuleConfig)
  ocpp2_1?: Ocpp2xConfigModuleConfig = new Ocpp2xConfigModuleConfig();

  @IsOptional()
  @ValidateNested()
  @Type(() => Ocpp16ConfigModuleConfig)
  ocpp1_6?: Ocpp16ConfigModuleConfig = new Ocpp16ConfigModuleConfig();

  endpointPrefix = '/configuration';
  requests: OCPP_CallAction[] = [
    OCPP_CallAction.BootNotification,
    OCPP_CallAction.DataTransfer,
    OCPP_CallAction.FirmwareStatusNotification,
    OCPP_CallAction.Heartbeat,
    OCPP_CallAction.NotifyDisplayMessages,
    OCPP_CallAction.PublishFirmwareStatusNotification,
  ];
  responses: OCPP_CallAction[] = [
    OCPP_CallAction.ChangeAvailability,
    OCPP_CallAction.ChangeConfiguration,
    OCPP_CallAction.ClearDisplayMessage,
    OCPP_CallAction.DataTransfer,
    OCPP_CallAction.GetConfiguration,
    OCPP_CallAction.GetDisplayMessages,
    OCPP_CallAction.PublishFirmware,
    OCPP_CallAction.Reset,
    OCPP_CallAction.SetDisplayMessage,
    OCPP_CallAction.SetNetworkProfile,
    OCPP_CallAction.TriggerMessage,
    OCPP_CallAction.UnpublishFirmware,
    OCPP_CallAction.UpdateFirmware,
  ];
}

// ─── modules.evdriver ─────────────────────────────────────────────────────────

/**
 * EvDriverModuleConfig config slice — class-validator-shaped data container.
 */
export class EvDriverModuleConfig extends BaseModuleConfig {
  @IsBoolean()
  @IsOptional()
  enableGetChargingProfilesOnStartTransaction?: boolean = true;

  endpointPrefix = '/evdriver';
  requests: OCPP_CallAction[] = [
    OCPP_CallAction.Authorize,
    OCPP_CallAction.ReservationStatusUpdate,
    OCPP_CallAction.VatNumberValidation,
  ];
  responses: OCPP_CallAction[] = [
    OCPP_CallAction.CancelReservation,
    OCPP_CallAction.ClearCache,
    OCPP_CallAction.GetLocalListVersion,
    OCPP_CallAction.RemoteStartTransaction,
    OCPP_CallAction.RemoteStopTransaction,
    OCPP_CallAction.RequestStartTransaction,
    OCPP_CallAction.RequestStopTransaction,
    OCPP_CallAction.ReserveNow,
    OCPP_CallAction.SendLocalList,
    OCPP_CallAction.UnlockConnector,
  ];
}

// ─── modules.transactions ─────────────────────────────────────────────────────

/**
 * SignedMeterValuesConfig config slice — class-validator-shaped data container.
 */
export class SignedMeterValuesConfig {
  @IsString() publicKeyFileId: string;
  @IsEnum(['RSASSA-PKCS1-v1_5', 'ECDSA']) signingMethod: 'RSASSA-PKCS1-v1_5' | 'ECDSA';
}

/**
 * Flat-rate cost-per-kWh fallback used by `CostService` when no full
 * tariff is configured for a station. Matches legacy `pricePerKwh`
 * default config — the real OCPI tariff lookup is its own subsystem
 * tracked in §5.8 of the parity roadmap.
 */
export class FlatRateCostConfig {
  @IsString()
  @IsOptional()
  pricePerKwh?: string = '0';

  @IsString()
  @IsOptional()
  currency?: string = 'USD';
}

/**
 * TransactionsModuleConfig config slice — class-validator-shaped data container.
 */
export class TransactionsModuleConfig extends BaseModuleConfig {
  @IsNumber()
  @IsOptional()
  costUpdatedInterval?: number = 60;

  @IsBoolean()
  @IsOptional()
  sendCostUpdatedOnMeterValue?: boolean = false;

  /**
   * If a transaction goes longer than this many seconds without a meter
   * sample, the CSMS fires a `TriggerMessage(TransactionEvent)` CALL to
   * wake the charger. Mirrors legacy `_triggerIdleTransactionUpdate`.
   * Set to 0 to disable.
   */
  @IsNumber()
  @IsOptional()
  idleTransactionWatchdogSeconds?: number = 0;

  @IsOptional()
  @ValidateNested()
  @Type(() => FlatRateCostConfig)
  flatRateCost?: FlatRateCostConfig = new FlatRateCostConfig();

  @IsOptional()
  @ValidateNested()
  @Type(() => SignedMeterValuesConfig)
  signedMeterValuesConfiguration?: SignedMeterValuesConfig;

  endpointPrefix = '/transactions';
  requests: OCPP_CallAction[] = [
    OCPP_CallAction.MeterValues,
    OCPP_CallAction.StartTransaction,
    OCPP_CallAction.StatusNotification,
    OCPP_CallAction.StopTransaction,
    OCPP_CallAction.TransactionEvent,
    OCPP_CallAction.NotifySettlement,
  ];
  responses: OCPP_CallAction[] = [
    OCPP_CallAction.CostUpdated,
    OCPP_CallAction.GetTransactionStatus,
    OCPP_CallAction.SetDefaultTariff,
  ];
}

// ─── modules.monitoring ───────────────────────────────────────────────────────

/**
 * MonitoringModuleConfig config slice — class-validator-shaped data container.
 */
export class MonitoringModuleConfig extends BaseModuleConfig {
  endpointPrefix = '/monitoring';
  requests: OCPP_CallAction[] = [OCPP_CallAction.NotifyEvent];
  responses: OCPP_CallAction[] = [
    OCPP_CallAction.ClearVariableMonitoring,
    OCPP_CallAction.GetMonitoringReport,
    OCPP_CallAction.GetVariables,
    OCPP_CallAction.SetMonitoringBase,
    OCPP_CallAction.SetMonitoringLevel,
    OCPP_CallAction.SetVariableMonitoring,
    OCPP_CallAction.SetVariables,
  ];
}

// ─── modules.reporting ────────────────────────────────────────────────────────

/**
 * ReportingModuleConfig config slice — class-validator-shaped data container.
 */
export class ReportingModuleConfig extends BaseModuleConfig {
  endpointPrefix = '/reporting';
  requests: OCPP_CallAction[] = [
    OCPP_CallAction.DiagnosticsStatusNotification,
    OCPP_CallAction.LogStatusNotification,
    OCPP_CallAction.NotifyCustomerInformation,
    OCPP_CallAction.NotifyMonitoringReport,
    OCPP_CallAction.NotifyReport,
    OCPP_CallAction.SecurityEventNotification,
  ];
  responses: OCPP_CallAction[] = [
    OCPP_CallAction.CustomerInformation,
    OCPP_CallAction.GetBaseReport,
    OCPP_CallAction.GetDiagnostics,
    OCPP_CallAction.GetLog,
    OCPP_CallAction.GetMonitoringReport,
    OCPP_CallAction.GetReport,
  ];
}

// ─── modules.smartcharging (optional) ────────────────────────────────────────

/**
 * SmartChargingModuleConfig config slice — class-validator-shaped data container.
 */
export class SmartChargingModuleConfig extends BaseModuleConfig {
  endpointPrefix = '/smartcharging';
  requests: OCPP_CallAction[] = [
    OCPP_CallAction.ClearedChargingLimit,
    OCPP_CallAction.NotifyChargingLimit,
    OCPP_CallAction.NotifyEVChargingNeeds,
    OCPP_CallAction.NotifyEVChargingSchedule,
    OCPP_CallAction.ReportChargingProfiles,
  ];
  responses: OCPP_CallAction[] = [
    OCPP_CallAction.ClearChargingProfile,
    OCPP_CallAction.GetChargingProfiles,
    OCPP_CallAction.GetCompositeSchedule,
    OCPP_CallAction.SetChargingProfile,
  ];
}

// ─── modules.certificates (optional) ─────────────────────────────────────────

/**
 * CertificatesModuleConfig config slice — class-validator-shaped data container.
 */
export class CertificatesModuleConfig extends BaseModuleConfig {
  endpointPrefix = '/certificates';
  requests: OCPP_CallAction[] = [
    OCPP_CallAction.Get15118EVCertificate,
    OCPP_CallAction.GetCertificateStatus,
    OCPP_CallAction.SignCertificate,
  ];
  responses: OCPP_CallAction[] = [
    OCPP_CallAction.CertificateSigned,
    OCPP_CallAction.DeleteCertificate,
    OCPP_CallAction.GetInstalledCertificateIds,
    OCPP_CallAction.InstallCertificate,
  ];
}

// ─── modules.tenant ───────────────────────────────────────────────────────────

/**
 * TenantModuleConfig config slice — class-validator-shaped data container.
 */
export class TenantModuleConfig extends BaseModuleConfig {
  @IsString()
  @IsOptional()
  ocppRouterBaseUrl?: string;

  endpointPrefix = '/tenant';
  requests: OCPP_CallAction[] = [];
  responses: OCPP_CallAction[] = [];
}

// ─── modules ──────────────────────────────────────────────────────────────────

/**
 * ModulesConfig config slice — class-validator-shaped data container.
 */
export class ModulesConfig {
  @IsOptional()
  @ValidateNested()
  @Type(() => CertificatesModuleConfig)
  certificates?: CertificatesModuleConfig = new CertificatesModuleConfig();

  @ValidateNested()
  @Type(() => ConfigurationModuleConfig)
  configuration: ConfigurationModuleConfig = new ConfigurationModuleConfig();

  @ValidateNested()
  @Type(() => EvDriverModuleConfig)
  evdriver: EvDriverModuleConfig = new EvDriverModuleConfig();

  @ValidateNested()
  @Type(() => MonitoringModuleConfig)
  monitoring: MonitoringModuleConfig = new MonitoringModuleConfig();

  @ValidateNested()
  @Type(() => ReportingModuleConfig)
  reporting: ReportingModuleConfig = new ReportingModuleConfig();

  @IsOptional()
  @ValidateNested()
  @Type(() => SmartChargingModuleConfig)
  smartcharging?: SmartChargingModuleConfig = new SmartChargingModuleConfig();

  @ValidateNested()
  @Type(() => TenantModuleConfig)
  tenant: TenantModuleConfig = new TenantModuleConfig();

  @ValidateNested()
  @Type(() => TransactionsModuleConfig)
  transactions: TransactionsModuleConfig = new TransactionsModuleConfig();
}

// ─── database (NestJS-only, no SystemConfig equivalent) ──────────────────────

/**
 * DatabaseConfig config slice — class-validator-shaped data container.
 */
export class DatabaseConfig {
  @IsString()
  host: string = 'localhost';

  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  port: number = 5432;

  @IsString()
  username: string = 'citrine';

  @IsString()
  password: string = 'citrine';

  @IsString()
  name: string = 'citrine';

  @IsOptional()
  @IsString()
  migrationsFolder?: string;
}

// ─── Top-level additions ──────────────────────────────────────────────────────

/**
 * CentralSystemConfig config slice — class-validator-shaped data container.
 */
export class CentralSystemConfig {
  @IsString()
  @IsOptional()
  host?: string = '::';

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  port?: number = 8080;
}

/**
 * OcpiServerConfig config slice — class-validator-shaped data container.
 */
export class OcpiServerConfig {
  @IsString() @IsOptional() host?: string = 'localhost';
  @IsNumber() @IsOptional() port?: number = 8085;
}

/**
 * UserPreferencesConfig config slice — class-validator-shaped data container.
 */
export class UserPreferencesConfig {
  @IsBoolean() @IsOptional() telemetryConsent?: boolean = false;
}

/**
 * OidcClientConfig config slice — class-validator-shaped data container.
 */
export class OidcClientConfig {
  @IsString() tokenUrl: string;
  @IsString() clientId: string;
  @IsString() clientSecret: string;
  @IsString() audience: string;
}

// ─── AppConfig (mirrors SystemConfig exactly, plus NestJS-only `database`) ───

/**
 * AppConfig config slice — class-validator-shaped data container.
 */
export class AppConfig {
  @IsEnum(['development', 'production'])
  env: 'development' | 'production' = 'development';

  @ValidateNested()
  @Type(() => CentralSystemConfig)
  centralSystem: CentralSystemConfig = new CentralSystemConfig();

  @ValidateNested()
  @Type(() => ModulesConfig)
  modules: ModulesConfig = new ModulesConfig();

  @ValidateNested()
  @Type(() => UtilConfig)
  util: UtilConfig = new UtilConfig();

  /** NestJS-only: not in SystemConfig — Drizzle connection settings. */
  @ValidateNested()
  @Type(() => DatabaseConfig)
  database: DatabaseConfig = new DatabaseConfig();

  @IsNumber()
  @IsOptional()
  logLevel?: number = 2;

  @IsNumber()
  @IsOptional()
  maxCallLengthSeconds?: number = 30;

  @IsNumber()
  @IsOptional()
  maxCachingSeconds?: number = 30;

  @IsNumber()
  @IsOptional()
  maxReconnectDelay?: number = 30;

  @IsNumber()
  @IsOptional()
  realTimeAuthDefaultTimeoutSeconds?: number = 15;

  @IsOptional()
  @ValidateNested()
  @Type(() => OcpiServerConfig)
  ocpiServer?: OcpiServerConfig;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserPreferencesConfig)
  userPreferences?: UserPreferencesConfig;

  @IsString() @IsOptional() rbacRulesFileName?: string;
  @IsString() @IsOptional() rbacRulesDir?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => OidcClientConfig)
  oidcClient?: OidcClientConfig;
}
