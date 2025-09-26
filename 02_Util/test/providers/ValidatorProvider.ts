import { OCPP2_0_1 } from '@citrineos/base';
import { faker } from '@faker-js/faker';
import {
  ChargingNeeds,
  Evse,
  IChargingProfileRepository,
  IDeviceModelRepository,
  ITransactionEventRepository,
  TransactionEvent,
  VariableAttribute,
} from '@citrineos/data';
import { ILogObj, Logger } from 'tslog';

// Mock logger that can be used in tests
export function createMockLogger(): jest.Mocked<Logger<ILogObj>> {
  return {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as any;
}

// ChargingProfileType builders
export function aChargingProfileType(
  override?: Partial<OCPP2_0_1.ChargingProfileType>,
): OCPP2_0_1.ChargingProfileType {
  return {
    id: faker.number.int({ min: 1, max: 999999 }),
    stackLevel: faker.number.int({ min: 0, max: 10 }),
    chargingProfilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile,
    chargingProfileKind: OCPP2_0_1.ChargingProfileKindEnumType.Absolute,
    chargingSchedule: [aChargingSchedule()],
    ...override,
  };
}

export function aChargingSchedule(
  override?: Partial<OCPP2_0_1.ChargingScheduleType>,
): OCPP2_0_1.ChargingScheduleType {
  return {
    id: faker.number.int({ min: 1, max: 999999 }),
    chargingRateUnit: OCPP2_0_1.ChargingRateUnitEnumType.W,
    chargingSchedulePeriod: [aChargingSchedulePeriod()],
    ...override,
  };
}

export function aChargingSchedulePeriod(
  override?: Partial<OCPP2_0_1.ChargingSchedulePeriodType>,
): OCPP2_0_1.ChargingSchedulePeriodType {
  return {
    startPeriod: faker.number.int({ min: 0, max: 86400 }),
    limit: faker.number.float({ min: 0, max: 100, fractionDigits: 1 }),
    ...override,
  };
}

export function aSalesTariff(
  override?: Partial<OCPP2_0_1.SalesTariffType>,
): OCPP2_0_1.SalesTariffType {
  return {
    id: faker.number.int({ min: 1, max: 999999 }),
    salesTariffEntry: [aSalesTariffEntry()],
    ...override,
  };
}

export function aSalesTariffEntry(
  override?: Partial<OCPP2_0_1.SalesTariffEntryType>,
): OCPP2_0_1.SalesTariffEntryType {
  return {
    relativeTimeInterval: aRelativeTimeInterval(),
    ...override,
  };
}

export function aRelativeTimeInterval(
  override?: Partial<OCPP2_0_1.RelativeTimeIntervalType>,
): OCPP2_0_1.RelativeTimeIntervalType {
  return {
    start: faker.number.int({ min: 0, max: 86400 }),
    ...override,
  };
}

export function aConsumptionCost(
  override?: Partial<OCPP2_0_1.ConsumptionCostType>,
): OCPP2_0_1.ConsumptionCostType {
  return {
    startValue: faker.number.float({ min: 0, max: 1000 }),
    cost: [aCost()],
    ...override,
  };
}

export function aCost(override?: Partial<OCPP2_0_1.CostType>): OCPP2_0_1.CostType {
  return {
    costKind: OCPP2_0_1.CostKindEnumType.CarbonDioxideEmission,
    amount: faker.number.int({ min: 0, max: 999999 }),
    ...override,
  };
}

// Repository mock builders
export function createMockDeviceModelRepository(): jest.Mocked<IDeviceModelRepository> {
  return {
    findEvseByIdAndConnectorId: jest.fn(),
    readAllByQuerystring: jest.fn(),
  } as any;
}

export function createMockChargingProfileRepository(): jest.Mocked<IChargingProfileRepository> {
  return {
    findChargingNeedsByEvseDBIdAndTransactionDBId: jest.fn(),
  } as any;
}

export function createMockTransactionEventRepository(): jest.Mocked<ITransactionEventRepository> {
  return {
    readTransactionByStationIdAndTransactionId: jest.fn(),
  } as any;
}

// Test data for repository responses
export function aVariableAttribute(override?: Partial<VariableAttribute>): VariableAttribute {
  return {
    id: faker.number.int({ min: 1, max: 999999 }),
    tenantId: faker.number.int({ min: 1, max: 100 }),
    stationId: faker.string.alphanumeric(10),
    type: OCPP2_0_1.AttributeEnumType.Actual,
    value: faker.number.int({ min: 1, max: 100 }).toString(),
    dataType: OCPP2_0_1.DataEnumType.integer,
    mutability: OCPP2_0_1.MutabilityEnumType.ReadOnly,
    persistent: false,
    constant: false,
    generatedAt: new Date().toISOString(),
    ...override,
  } as VariableAttribute;
}

export function aTransactionEvent(override?: Partial<TransactionEvent>): TransactionEvent {
  return {
    id: faker.number.int({ min: 1, max: 999999 }),
    tenantId: faker.number.int({ min: 1, max: 100 }),
    stationId: faker.string.alphanumeric(10),
    eventType: OCPP2_0_1.TransactionEventEnumType.Started,
    timestamp: new Date().toISOString(),
    triggerReason: OCPP2_0_1.TriggerReasonEnumType.Authorized,
    seqNo: faker.number.int({ min: 0, max: 100 }),
    transactionInfo: {
      transactionId: faker.string.uuid(),
    } as OCPP2_0_1.TransactionType,
    ...override,
  } as TransactionEvent;
}

export function anEvse(override?: Partial<Evse>): Evse {
  return {
    databaseId: faker.number.int({ min: 1, max: 999999 }),
    id: faker.number.int({ min: 1, max: 10 }),
    tenantId: faker.number.int({ min: 1, max: 100 }),
    stationId: faker.string.alphanumeric(10),
    connectorId: faker.number.int({ min: 1, max: 2 }),
    ...override,
  } as Evse;
}

export function aChargingNeeds(override?: Partial<ChargingNeeds>): ChargingNeeds {
  return {
    id: faker.number.int({ min: 1, max: 999999 }),
    tenantId: faker.number.int({ min: 1, max: 100 }),
    maxScheduleTuples: faker.number.int({ min: 1, max: 10 }),
    requestedEnergyTransfer: OCPP2_0_1.EnergyTransferModeEnumType.AC_single_phase,
    acChargingParameters: {
      energyAmount: faker.number.int({ min: 1000, max: 50000 }),
      evMinCurrent: faker.number.int({ min: 6, max: 32 }),
      evMaxCurrent: faker.number.int({ min: 6, max: 32 }),
      evMaxVoltage: faker.number.int({ min: 230, max: 400 }),
    },
    ...override,
  } as ChargingNeeds;
}

// ID Token test data generators
export function generateValidISO15693Token(): string {
  return faker.string.hexadecimal({ length: 16, prefix: '' }).toUpperCase();
}

export function generateValidISO14443Token(length: 8 | 14 = 8): string {
  return faker.string.hexadecimal({ length, prefix: '' }).toUpperCase();
}

export function generateValidIdentifierString(): string {
  const allowedChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*-_=:+|@.';
  let result = '';
  for (let i = 0; i < faker.number.int({ min: 1, max: 20 }); i++) {
    result += allowedChars.charAt(faker.number.int({ min: 0, max: allowedChars.length - 1 }));
  }
  return result;
}

// Language tag test data
export const VALID_LANGUAGE_TAGS = [
  'en-US',
  'en-GB',
  'fr-FR',
  'de-DE',
  'zh-CN',
  'ja-JP',
  'es-ES',
  'pt-BR',
  'ru-RU',
  'ar-SA',
  'hi-IN',
  'en',
  'fr',
  'de',
  'zh',
  'x-private',
  'en-US-x-private',
  'zh-Hant-HK',
  'sr-Latn-RS',
] as const;

export const INVALID_LANGUAGE_TAGS = [
  '',
  'e',
  'en_US', // underscores not allowed
  'en-', // trailing dash
  '-US', // leading dash
  'en--US', // double dash
  'en-U', // single character region
  'en-USA1', // alphanumeric region not in right format
  '123', // numeric only
  'en@US', // @ character not allowed
  'en US', // space not allowed
  'en-US-', // trailing dash after valid tag
  'en-US--extra', // double dash in extensions
] as const;
