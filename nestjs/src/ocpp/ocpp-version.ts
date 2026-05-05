// Source: @citrineos/base/src/ocpp/rpc/message.ts
// Copied locally — base package is ESM-only and incompatible with NestJS CommonJS.

export enum OCPPVersion {
  OCPP1_6 = 'ocpp1.6',
  OCPP2_0_1 = 'ocpp2.0.1',
  OCPP2_1 = 'ocpp2.1',
}

export const OCPP_2_VER_LIST = [OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1];

export type OCPPVersionType = 'ocpp1.6' | 'ocpp2.0.1' | 'ocpp2.1';
