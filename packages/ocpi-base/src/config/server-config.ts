// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Minimal ServerConfig compatibility interface for OCPI
 * This provides just enough structure for existing repositories to work
 * without requiring the full citrineos-core ServerConfig
 */

export enum Env {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}

export interface SequelizeConfig {
  host: string;
  port: number;
  database: string;
  dialect: string;
  username: string;
  password: string;
  storage: string;
  sync: boolean;
  alter?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface ServerConfigData {
  sequelize: SequelizeConfig;
}

export interface CentralSystemConfig {
  host: string;
  port: number;
}

export interface CacheConfig {
  redis: {
    host: string;
    port: number;
  };
}

export interface MessageBrokerConfig {
  amqp: boolean;
}

export interface DirectusConfig {
  generateFlows?: boolean;
}

export interface NetworkConnectionConfig {
  websocketServers: any[];
}

export interface UtilConfig {
  cache: CacheConfig;
  messageBroker: MessageBrokerConfig;
  swagger?: any;
  directus?: DirectusConfig;
  networkConnection: NetworkConnectionConfig;
}

export interface OcpiServerConfig {
  host: string;
  port: number;
}

export interface ServerConfig {
  env: Env;
  data: ServerConfigData;
  logLevel: number;
  centralSystem: CentralSystemConfig;
  util: UtilConfig;
  ocpiServer: OcpiServerConfig;
  modules: any;
  maxCallLengthSeconds: number;
  maxCachingSeconds: number;
}
