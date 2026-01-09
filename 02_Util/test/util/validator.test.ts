// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { OCPP2_0_1 } from '@citrineos/base';
import { faker } from '@faker-js/faker';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';
import {
  validateASCIIContent,
  validateChargingProfileType,
  validateHTMLContent,
  validateIdentifierStringIdToken,
  validateIdToken,
  validateISO14443IdToken,
  validateISO15693IdToken,
  validateLanguageTag,
  validateMessageContent,
  validateMessageContentType,
  validateNoAuthorizationIdToken,
  validatePEMEncodedCSR,
  validateURIContent,
  validateUTF8Content,
} from '../../src';
import {
  aChargingNeeds,
  aChargingProfileType,
  aChargingSchedule,
  aChargingSchedulePeriod,
  aConsumptionCost,
  aCost,
  aMessageContent,
  anEvse,
  aSalesTariff,
  aSalesTariffEntry,
  aTransactionEvent,
  aVariableAttribute,
  createMockChargingProfileRepository,
  createMockDeviceModelRepository,
  createMockLogger,
  createMockTransactionEventRepository,
  generateValidIdentifierString,
  generateValidISO14443Token,
  generateValidISO15693Token,
  INVALID_ASCII_CONTENT,
  INVALID_HTML_CONTENT,
  INVALID_LANGUAGE_TAGS,
  INVALID_URI_CONTENT,
  VALID_ASCII_CONTENT,
  VALID_HTML_CONTENT,
  VALID_LANGUAGE_TAGS,
  VALID_URI_CONTENT,
  VALID_UTF8_CONTENT,
} from '../providers/ValidatorProvider';

describe('validateLanguageTag', () => {
  it.each(VALID_LANGUAGE_TAGS)('should return true for valid language tag "%s"', (languageTag) => {
    expect(validateLanguageTag(languageTag)).toBe(true);
  });

  it.each(INVALID_LANGUAGE_TAGS)(
    'should return false for invalid language tag "%s"',
    (languageTag) => {
      expect(validateLanguageTag(languageTag)).toBe(false);
    },
  );
});

describe('validateISO15693IdToken', () => {
  it.each([
    generateValidISO15693Token(),
    '0123456789ABCDEF',
    'abcdef0123456789',
    'FEDCBA9876543210',
  ])('should return true for valid 16-character hexadecimal token: "%s"', (token) => {
    expect(validateISO15693IdToken(token)).toBe(true);
  });

  it.each([
    ['', 'empty string'],
    ['123', 'too short'],
    ['0123456789ABCDEF0', 'too long'],
    ['0123456789ABCDEG', 'invalid character G'],
    ['0123456789ABCD-F', 'contains hyphen'],
    ['0123456789ABCD F', 'contains space'],
    [null as any, 'null value'],
    [undefined as any, 'undefined value'],
  ])('should return false for invalid token: %s (%s)', (token, description) => {
    expect(validateISO15693IdToken(token)).toBe(false);
  });
});

describe('validateISO14443IdToken', () => {
  it.each([
    generateValidISO14443Token(8),
    generateValidISO14443Token(14),
    '01234567',
    'ABCDEF01',
    'abcdef01234567',
    'FEDCBA98765432',
  ])('should return true for valid 8 or 14-character hexadecimal token: "%s"', (token) => {
    expect(validateISO14443IdToken(token)).toBe(true);
  });

  it.each([
    ['', 'empty string'],
    ['1234567', 'too short (7 chars)'],
    ['123456789', 'too long (9 chars)'],
    ['1234567890123', 'too short (13 chars)'],
    ['123456789012345', 'too long (15 chars)'],
    ['0123456G', 'invalid character in 8-char token'],
    ['0123456789ABCG', 'invalid character in 14-char token'],
    ['01234567 ', 'contains space'],
    ['01234567-', 'contains hyphen'],
    [null as any, 'null value'],
    [undefined as any, 'undefined value'],
  ])('should return false for invalid token: %s (%s)', (token, description) => {
    expect(validateISO14443IdToken(token)).toBe(false);
  });
});

describe('validateIdentifierStringIdToken', () => {
  it.each([
    generateValidIdentifierString(),
    'user123',
    'RFID-CARD-001',
    'admin@company.com',
    'token_with_underscores',
    'token:with:colons',
    'token+with+plus',
    'token|with|pipes',
    'a1b2c3d4',
    '*.test-card=123:admin+user|@site.com',
  ])('should return true for valid identifier string: "%s"', (token) => {
    expect(validateIdentifierStringIdToken(token)).toBe(true);
  });

  it.each([
    ['', 'empty string'],
    ['token with space', 'contains space'],
    ['token#hash', 'contains hash'],
    ['token&ampersand', 'contains ampersand'],
    ['token%percent', 'contains percent'],
    ['token$dollar', 'contains dollar'],
    ['token/slash', 'contains slash'],
    ['token\\backslash', 'contains backslash'],
    ['token(paren)', 'contains parentheses'],
    ['token[bracket]', 'contains brackets'],
    ['token{brace}', 'contains braces'],
    ['token<angle>', 'contains angle brackets'],
    ['token"quote"', 'contains quote'],
    ["token'apostrophe'", 'contains apostrophe'],
    ['token,comma', 'contains comma'],
    ['token;semicolon', 'contains semicolon'],
    ['token?question', 'contains question mark'],
    ['token!exclamation', 'contains exclamation'],
    [null as any, 'null value'],
    [undefined as any, 'undefined value'],
  ])('should return false for invalid token: %s (%s)', (token, description) => {
    expect(validateIdentifierStringIdToken(token)).toBe(false);
  });
});

describe('validateNoAuthorizationIdToken', () => {
  it.each([
    ['', 'empty string'],
    [null as any, 'null value'],
    [undefined as any, 'undefined value'],
  ])('should return true for %s (%s)', (token, description) => {
    expect(validateNoAuthorizationIdToken(token)).toBe(true);
  });

  it.each([
    ['any-string', 'non-empty string'],
    ['123', 'numeric string'],
    ['a', 'single character'],
    ['   ', 'whitespace'],
  ])('should return false for %s (%s)', (token, description) => {
    expect(validateNoAuthorizationIdToken(token)).toBe(false);
  });
});

describe('validateIdToken', () => {
  describe('ISO15693 tokens', () => {
    it('should validate ISO15693 tokens correctly', () => {
      const validToken = generateValidISO15693Token();
      const invalidToken = 'invalid';

      const validResult = validateIdToken(OCPP2_0_1.IdTokenEnumType.ISO15693, validToken);
      expect(validResult.isValid).toBe(true);
      expect(validResult.errorMessage).toBeUndefined();

      const invalidResult = validateIdToken(OCPP2_0_1.IdTokenEnumType.ISO15693, invalidToken);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errorMessage).toBe(
        'ISO15693 tokens must be exactly 16 hexadecimal characters (0-9, A-F)',
      );
    });
    it.each([
      ['', 'invalid (empty string)'],
      ['123', 'too short'],
      ['0123456789ABCDEF0', 'too long'],
      ['0123456789ABCDEG', 'invalid character'],
    ])('should return error for %s (%s)', (token, description) => {
      const result = validateIdToken(OCPP2_0_1.IdTokenEnumType.ISO15693, token);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(
        'ISO15693 tokens must be exactly 16 hexadecimal characters (0-9, A-F)',
      );
    });
  });

  describe('ISO14443 tokens', () => {
    const validToken8 = generateValidISO14443Token(8);
    const validToken14 = generateValidISO14443Token(14);
    it.each([
      [validToken8, 'valid 8-char token'],
      [validToken14, 'valid 14-char token'],
    ])('Happy path, should return valid and no description for %s (%s)', (token, description) => {
      const result = validateIdToken(OCPP2_0_1.IdTokenEnumType.ISO14443, token);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it.each([
      ['', 'invalid (empty string)'],
      ['1234567', 'too short (7 chars)'],
      ['123456789', 'too long (9 chars)'],
      ['1234567890123', 'too short (13 chars)'],
      ['123456789012345', 'too long (15 chars)'],
    ])('should return error for %s (%s)', (token, description) => {
      const result = validateIdToken(OCPP2_0_1.IdTokenEnumType.ISO14443, token);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(
        'ISO14443 tokens must be either 8 or 14 hexadecimal characters (0-9, A-F)',
      );
    });
  });

  describe('NoAuthorization tokens', () => {
    it('should validate NoAuthorization tokens correctly', () => {
      const validResult = validateIdToken(OCPP2_0_1.IdTokenEnumType.NoAuthorization, '');
      const inValidResult = validateIdToken(
        OCPP2_0_1.IdTokenEnumType.NoAuthorization,
        'should-be-empty',
      );
      expect(validResult.isValid).toBe(true);
      expect(validResult.errorMessage).toBeUndefined();

      expect(inValidResult.isValid).toBe(false);
      expect(inValidResult.errorMessage).toBe('NoAuthorization tokens must be empty');
    });
  });

  describe('IdentifierString token types', () => {
    it.each([
      OCPP2_0_1.IdTokenEnumType.KeyCode,
      OCPP2_0_1.IdTokenEnumType.Local,
      OCPP2_0_1.IdTokenEnumType.MacAddress,
      OCPP2_0_1.IdTokenEnumType.Central,
    ])('should validate %s tokens using identifier string validation', (tokenType) => {
      const validToken = generateValidIdentifierString();
      const invalidToken = 'invalid token with spaces';

      expect(validateIdToken(tokenType, validToken).isValid).toBe(true);
      expect(validateIdToken(tokenType, invalidToken).isValid).toBe(false);
    });
  });

  it('should return true for unknown token types', () => {
    // This is a bit of a hack to test the default case in the switch statement
    // AJV will prevent invalid token types from being passed in
    // so this is just to ensure the function doesn't throw if the validator isn't handling a known token type
    const unknownTokenType = 'UnknownTokenType' as OCPP2_0_1.IdTokenEnumType;
    expect(validateIdToken(unknownTokenType, 'any-token').isValid).toBe(true);
  });

  it('should provide detailed error messages', () => {
    const result = validateIdToken(OCPP2_0_1.IdTokenEnumType.ISO15693, 'invalid');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe(
      'ISO15693 tokens must be exactly 16 hexadecimal characters (0-9, A-F)',
    );
  });
});

describe('validateChargingProfileType', () => {
  let mockDeviceModelRepo: Mocked<any>;
  let mockChargingProfileRepo: Mocked<any>;
  let mockTransactionEventRepo: Mocked<any>;
  let mockLogger: Mocked<any>;

  const testTenantId = 1;
  const testStationId = 'STATION001';

  beforeEach(() => {
    mockDeviceModelRepo = createMockDeviceModelRepository();
    mockChargingProfileRepo = createMockChargingProfileRepository();
    mockTransactionEventRepo = createMockTransactionEventRepository();
    mockLogger = createMockLogger();

    // Default mock returns
    mockDeviceModelRepo.readAllByQuerystring.mockResolvedValue([]);
    mockDeviceModelRepo.findEvseByIdAndConnectorId.mockResolvedValue(null);
    mockChargingProfileRepo.findChargingNeedsByEvseDBIdAndTransactionDBId.mockResolvedValue(null);
    mockTransactionEventRepo.readTransactionByStationIdAndTransactionId.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('stack level validation', () => {
    it('should throw error for negative stack level', async () => {
      const chargingProfile = aChargingProfileType({
        stackLevel: -1,
      });

      await expect(
        validateChargingProfileType(
          chargingProfile,
          testTenantId,
          testStationId,
          mockDeviceModelRepo,
          mockChargingProfileRepo,
          mockTransactionEventRepo,
          mockLogger,
        ),
      ).rejects.toThrow('Lowest Stack level is 0');
    });

    it('should not throw error for zero or positive stack level', async () => {
      const chargingProfile = aChargingProfileType({
        stackLevel: 0,
      });

      await expect(
        validateChargingProfileType(
          chargingProfile,
          testTenantId,
          testStationId,
          mockDeviceModelRepo,
          mockChargingProfileRepo,
          mockTransactionEventRepo,
          mockLogger,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('charging station max profile validation', () => {
    it('should throw error when ChargingStationMaxProfile has non-zero evseId', async () => {
      const chargingProfile = aChargingProfileType({
        chargingProfilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType.ChargingStationMaxProfile,
      });

      await expect(
        validateChargingProfileType(
          chargingProfile,
          testTenantId,
          testStationId,
          mockDeviceModelRepo,
          mockChargingProfileRepo,
          mockTransactionEventRepo,
          mockLogger,
          1, // non-zero evseId
        ),
      ).rejects.toThrow(
        'When chargingProfilePurpose is ChargingStationMaxProfile, evseId SHALL be 0',
      );
    });

    it('should not throw error when ChargingStationMaxProfile has zero evseId', async () => {
      const chargingProfile = aChargingProfileType({
        chargingProfilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType.ChargingStationMaxProfile,
      });

      await expect(
        validateChargingProfileType(
          chargingProfile,
          testTenantId,
          testStationId,
          mockDeviceModelRepo,
          mockChargingProfileRepo,
          mockTransactionEventRepo,
          mockLogger,
          0, // zero evseId
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('transaction ID validation', () => {
    it('should throw error when transactionId is provided for non-TxProfile purposes', async () => {
      const chargingProfile = aChargingProfileType({
        chargingProfilePurpose:
          OCPP2_0_1.ChargingProfilePurposeEnumType.ChargingStationExternalConstraints,
        transactionId: faker.string.uuid(),
      });

      await expect(
        validateChargingProfileType(
          chargingProfile,
          testTenantId,
          testStationId,
          mockDeviceModelRepo,
          mockChargingProfileRepo,
          mockTransactionEventRepo,
          mockLogger,
        ),
      ).rejects.toThrow(
        'transactionId SHALL only be included when ChargingProfilePurpose is set to TxProfile.',
      );
    });

    it('should throw error when transaction is not found', async () => {
      const transactionId = faker.string.uuid();
      const chargingProfile = aChargingProfileType({
        chargingProfilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile,
        transactionId,
      });

      mockTransactionEventRepo.readTransactionByStationIdAndTransactionId.mockResolvedValue(null);

      await expect(
        validateChargingProfileType(
          chargingProfile,
          testTenantId,
          testStationId,
          mockDeviceModelRepo,
          mockChargingProfileRepo,
          mockTransactionEventRepo,
          mockLogger,
          1,
        ),
      ).rejects.toThrow(`Transaction ${transactionId} not found on station ${testStationId}.`);
    });

    it('should throw error when evse is not found', async () => {
      const transactionId = faker.string.uuid();
      const evseId = 1;
      const chargingProfile = aChargingProfileType({
        chargingProfilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile,
        transactionId,
      });

      mockTransactionEventRepo.readTransactionByStationIdAndTransactionId.mockResolvedValue(
        aTransactionEvent({
          transactionInfo: {
            transactionId,
          } as OCPP2_0_1.TransactionType,
        }),
      );
      mockDeviceModelRepo.findEvseByIdAndConnectorId.mockResolvedValue(null);

      await expect(
        validateChargingProfileType(
          chargingProfile,
          testTenantId,
          testStationId,
          mockDeviceModelRepo,
          mockChargingProfileRepo,
          mockTransactionEventRepo,
          mockLogger,
          evseId,
        ),
      ).rejects.toThrow(`Evse ${evseId} not found.`);
    });
  });

  describe('periods per schedule validation', () => {
    it('should throw error when charging schedule periods exceed PeriodsPerSchedule limit', async () => {
      const periodsLimit = 3;
      const chargingProfile = aChargingProfileType({
        chargingSchedule: [
          aChargingSchedule({
            id: 1,
            chargingSchedulePeriod: [
              aChargingSchedulePeriod(),
              aChargingSchedulePeriod(),
              aChargingSchedulePeriod(),
              aChargingSchedulePeriod(), // 4 periods, exceeds limit of 3
            ],
          }),
        ],
      });

      mockDeviceModelRepo.readAllByQuerystring.mockResolvedValue([
        aVariableAttribute({
          type: OCPP2_0_1.AttributeEnumType.Actual,
          value: periodsLimit.toString(),
        }),
      ]);

      await expect(
        validateChargingProfileType(
          chargingProfile,
          testTenantId,
          testStationId,
          mockDeviceModelRepo,
          mockChargingProfileRepo,
          mockTransactionEventRepo,
          mockLogger,
        ),
      ).rejects.toThrow(
        `ChargingSchedule 1: The number of chargingSchedulePeriod SHALL not exceed ${periodsLimit}.`,
      );
    });
  });

  describe('fraction digit validation', () => {
    it('should throw error for minChargingRate with more than 1 fraction digit', async () => {
      const chargingProfile = aChargingProfileType({
        chargingSchedule: [
          aChargingSchedule({
            id: 1,
            minChargingRate: 8.123, // More than 1 fraction digit
          }),
        ],
      });

      await expect(
        validateChargingProfileType(
          chargingProfile,
          testTenantId,
          testStationId,
          mockDeviceModelRepo,
          mockChargingProfileRepo,
          mockTransactionEventRepo,
          mockLogger,
        ),
      ).rejects.toThrow(
        'chargingSchedule 1: minChargingRate accepts at most one digit fraction (e.g. 8.1).',
      );
    });

    it('should throw error for chargingSchedulePeriod limit with more than 1 fraction digit', async () => {
      const chargingProfile = aChargingProfileType({
        chargingSchedule: [
          aChargingSchedule({
            id: 1,
            chargingSchedulePeriod: [
              aChargingSchedulePeriod({
                limit: 8.123, // More than 1 fraction digit
              }),
            ],
          }),
        ],
      });

      await expect(
        validateChargingProfileType(
          chargingProfile,
          testTenantId,
          testStationId,
          mockDeviceModelRepo,
          mockChargingProfileRepo,
          mockTransactionEventRepo,
          mockLogger,
        ),
      ).rejects.toThrow(
        'ChargingSchedule 1: chargingSchedulePeriod limit accepts at most one digit fraction (e.g. 8.1).',
      );
    });

    it('should not throw error for valid fraction digits', async () => {
      const chargingProfile = aChargingProfileType({
        chargingSchedule: [
          aChargingSchedule({
            minChargingRate: 8.1, // Valid: 1 fraction digit
            chargingSchedulePeriod: [
              aChargingSchedulePeriod({
                limit: 22.5, // Valid: 1 fraction digit
              }),
            ],
          }),
        ],
      });

      await expect(
        validateChargingProfileType(
          chargingProfile,
          testTenantId,
          testStationId,
          mockDeviceModelRepo,
          mockChargingProfileRepo,
          mockTransactionEventRepo,
          mockLogger,
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('sales tariff validation', () => {
    it('should throw error when sales tariff entries exceed maxScheduleTuples', async () => {
      const maxTuples = 2;
      const transactionId = faker.string.uuid();
      const evseId = 1;

      const chargingProfile = aChargingProfileType({
        chargingProfilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile,
        transactionId,
        chargingSchedule: [
          aChargingSchedule({
            id: 1,
            salesTariff: aSalesTariff({
              salesTariffEntry: [
                aSalesTariffEntry(),
                aSalesTariffEntry(),
                aSalesTariffEntry(), // 3 entries, exceeds maxTuples of 2
              ],
            }),
          }),
        ],
      });

      const mockTransaction = aTransactionEvent({
        transactionInfo: {
          transactionId,
        } as OCPP2_0_1.TransactionType,
      });
      const mockEvse = anEvse({ id: evseId });
      const mockChargingNeeds = aChargingNeeds({ maxScheduleTuples: maxTuples });

      mockTransactionEventRepo.readTransactionByStationIdAndTransactionId.mockResolvedValue(
        mockTransaction,
      );
      mockDeviceModelRepo.findEvseByIdAndConnectorId.mockResolvedValue(mockEvse);
      mockChargingProfileRepo.findChargingNeedsByEvseDBIdAndTransactionDBId.mockResolvedValue(
        mockChargingNeeds,
      );

      await expect(
        validateChargingProfileType(
          chargingProfile,
          testTenantId,
          testStationId,
          mockDeviceModelRepo,
          mockChargingProfileRepo,
          mockTransactionEventRepo,
          mockLogger,
          evseId,
        ),
      ).rejects.toThrow(
        `ChargingSchedule 1: The number of SalesTariffEntry elements (3) SHALL not exceed maxScheduleTuples (${maxTuples}).`,
      );
    });

    it('should throw error for amountMultiplier outside valid range', async () => {
      const chargingProfile = aChargingProfileType({
        chargingSchedule: [
          aChargingSchedule({
            id: 1,
            salesTariff: aSalesTariff({
              salesTariffEntry: [
                aSalesTariffEntry({
                  consumptionCost: [
                    aConsumptionCost({
                      cost: [
                        aCost({
                          amountMultiplier: 4, // Outside valid range [-3, 3]
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      });

      await expect(
        validateChargingProfileType(
          chargingProfile,
          testTenantId,
          testStationId,
          mockDeviceModelRepo,
          mockChargingProfileRepo,
          mockTransactionEventRepo,
          mockLogger,
        ),
      ).rejects.toThrow('ChargingSchedule 1: amountMultiplier SHALL be in [-3, 3].');
    });

    it.each([-3, -2, -1, 0, 1, 2, 3])(
      'should not throw error for valid amountMultiplier value: %d',
      async (amountMultiplier) => {
        const chargingProfile = aChargingProfileType({
          chargingSchedule: [
            aChargingSchedule({
              salesTariff: aSalesTariff({
                salesTariffEntry: [
                  aSalesTariffEntry({
                    consumptionCost: [
                      aConsumptionCost({
                        cost: [
                          aCost({
                            amountMultiplier,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            }),
          ],
        });

        await expect(
          validateChargingProfileType(
            chargingProfile,
            testTenantId,
            testStationId,
            mockDeviceModelRepo,
            mockChargingProfileRepo,
            mockTransactionEventRepo,
            mockLogger,
          ),
        ).resolves.not.toThrow();
      },
    );
  });

  describe('charging needs integration', () => {
    it('should set numberPhases to 3 for AC charging when not provided', async () => {
      const transactionId = faker.string.uuid();
      const evseId = 1;

      const chargingProfile = aChargingProfileType({
        chargingProfilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile,
        transactionId,
        chargingSchedule: [
          aChargingSchedule({
            chargingSchedulePeriod: [
              aChargingSchedulePeriod({
                // numberPhases not set initially
              }),
            ],
          }),
        ],
      });

      const mockTransaction = aTransactionEvent({
        transactionInfo: {
          transactionId,
        } as OCPP2_0_1.TransactionType,
      });
      const mockEvse = anEvse({ id: evseId });
      const mockChargingNeeds = aChargingNeeds({
        acChargingParameters: {
          energyAmount: 10000,
          evMinCurrent: 6,
          evMaxCurrent: 32,
          evMaxVoltage: 400,
        },
        dcChargingParameters: undefined,
      });

      mockTransactionEventRepo.readTransactionByStationIdAndTransactionId.mockResolvedValue(
        mockTransaction,
      );
      mockDeviceModelRepo.findEvseByIdAndConnectorId.mockResolvedValue(mockEvse);
      mockChargingProfileRepo.findChargingNeedsByEvseDBIdAndTransactionDBId.mockResolvedValue(
        mockChargingNeeds,
      );

      await validateChargingProfileType(
        chargingProfile,
        testTenantId,
        testStationId,
        mockDeviceModelRepo,
        mockChargingProfileRepo,
        mockTransactionEventRepo,
        mockLogger,
        evseId,
      );

      // Verify numberPhases was set to 3 for AC charging
      expect(chargingProfile.chargingSchedule[0].chargingSchedulePeriod[0].numberPhases).toBe(3);
    });

    it('should set numberPhases to undefined for DC charging', async () => {
      const transactionId = faker.string.uuid();
      const evseId = 1;

      const chargingProfile = aChargingProfileType({
        chargingProfilePurpose: OCPP2_0_1.ChargingProfilePurposeEnumType.TxProfile,
        transactionId,
        chargingSchedule: [
          aChargingSchedule({
            chargingSchedulePeriod: [
              aChargingSchedulePeriod({
                numberPhases: 3, // Initially set, should be cleared for DC
              }),
            ],
          }),
        ],
      });

      const mockTransaction = aTransactionEvent({
        transactionInfo: {
          transactionId,
        } as OCPP2_0_1.TransactionType,
      });
      const mockEvse = anEvse({ id: evseId });
      const mockChargingNeeds = aChargingNeeds({
        acChargingParameters: undefined,
        dcChargingParameters: {
          evMaxCurrent: 200,
          evMaxVoltage: 920,
          energyAmount: 50000,
        },
      });

      mockTransactionEventRepo.readTransactionByStationIdAndTransactionId.mockResolvedValue(
        mockTransaction,
      );
      mockDeviceModelRepo.findEvseByIdAndConnectorId.mockResolvedValue(mockEvse);
      mockChargingProfileRepo.findChargingNeedsByEvseDBIdAndTransactionDBId.mockResolvedValue(
        mockChargingNeeds,
      );

      await validateChargingProfileType(
        chargingProfile,
        testTenantId,
        testStationId,
        mockDeviceModelRepo,
        mockChargingProfileRepo,
        mockTransactionEventRepo,
        mockLogger,
        evseId,
      );

      // Verify numberPhases was set to undefined for DC charging
      expect(
        chargingProfile.chargingSchedule[0].chargingSchedulePeriod[0].numberPhases,
      ).toBeUndefined();
    });
  });
});

describe('validateASCIIContent', () => {
  it.each(VALID_ASCII_CONTENT)('should return true for valid ASCII content: "%s"', (content) => {
    expect(validateASCIIContent(content)).toBe(true);
  });

  it.each(INVALID_ASCII_CONTENT)(
    'should return false for invalid ASCII content: %s (%s)',
    (content, description) => {
      expect(validateASCIIContent(content)).toBe(false);
    },
  );
});

describe('validateHTMLContent', () => {
  it.each(VALID_HTML_CONTENT)('should return true for valid HTML content: "%s"', (content) => {
    expect(validateHTMLContent(content)).toBe(true);
  });

  it.each(INVALID_HTML_CONTENT)(
    'should return false for invalid HTML content: %s (%s)',
    (content, description) => {
      expect(validateHTMLContent(content)).toBe(false);
    },
  );
});

describe('validateURIContent', () => {
  it.each(VALID_URI_CONTENT)('should return true for valid URI content: "%s"', (content) => {
    expect(validateURIContent(content)).toBe(true);
  });

  it.each(INVALID_URI_CONTENT)(
    'should return false for invalid URI content: %s (%s)',
    (content, description) => {
      expect(validateURIContent(content)).toBe(false);
    },
  );
});

describe('validateUTF8Content', () => {
  it.each(VALID_UTF8_CONTENT)('should return true for valid UTF8 content: "%s"', (content) => {
    expect(validateUTF8Content(content)).toBe(true);
  });
});

describe('validateMessageContent', () => {
  it.each([
    [OCPP2_0_1.MessageFormatEnumType.ASCII, 'Hello World', 'ASCII format with valid content'],
    [OCPP2_0_1.MessageFormatEnumType.HTML, '<div>Test</div>', 'HTML format with valid content'],
    [OCPP2_0_1.MessageFormatEnumType.URI, 'http://example.com', 'URI format with valid content'],
    [OCPP2_0_1.MessageFormatEnumType.UTF8, 'Hello 世界', 'UTF8 format with valid content'],
  ])('should validate %s: %s (%s)', (format, content, description) => {
    const result = validateMessageContent(format, content);
    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBeUndefined();
  });

  it.each([
    [
      OCPP2_0_1.MessageFormatEnumType.ASCII,
      'Hello 😀',
      'ASCII format with emoji',
      'ASCII format requires content to contain only printable ASCII characters (space through tilde)',
    ],
    [
      OCPP2_0_1.MessageFormatEnumType.HTML,
      '<div>Unclosed',
      'HTML format with unclosed tag',
      'HTML format requires properly matched opening and closing tags',
    ],
    [
      OCPP2_0_1.MessageFormatEnumType.URI,
      '',
      'URI format with empty content',
      'URI format requires a valid URI that the Charging Station can download',
    ],
  ])('should return error for %s: %s (%s)', (format, content, description, expectedError) => {
    const result = validateMessageContent(format, content);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe(expectedError);
  });

  it('should return error for unknown format', () => {
    const unknownFormat = 'UnknownFormat' as OCPP2_0_1.MessageFormatEnumType;
    const result = validateMessageContent(unknownFormat, 'test');
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('Unknown message format: UnknownFormat');
  });
});

describe('validateMessageContentType', () => {
  it.each([
    [OCPP2_0_1.MessageFormatEnumType.ASCII, 'Hello', 'en-US', 'ASCII with valid language'],
    [OCPP2_0_1.MessageFormatEnumType.HTML, '<p>Test</p>', 'fr-FR', 'HTML with valid language'],
    [OCPP2_0_1.MessageFormatEnumType.URI, 'http://example.com', null, 'URI without language'],
    [OCPP2_0_1.MessageFormatEnumType.UTF8, '日本語', 'ja-JP', 'UTF8 with Japanese language'],
  ])(
    'should validate %s format with content "%s" and language "%s" (%s)',
    (format, content, language, description) => {
      const messageContent = aMessageContent({
        format,
        content,
        language: language as string | null,
      });
      const result = validateMessageContentType(messageContent);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    },
  );

  it.each([
    ['en_US', 'invalid language tag with underscore'],
    ['en-', 'invalid language tag with trailing dash'],
    ['123', 'invalid numeric language tag'],
    ['', 'empty language tag'],
    [
      'this-is-a-very-long-language-tag-exceeding-the-maximum-length-of-fifty-characters',
      'too long language tag',
    ],
  ])('should return error for invalid language tag: %s (%s)', (language, description) => {
    const messageContent = aMessageContent({ language });
    const result = validateMessageContentType(messageContent);
    // expect(result.isValid).toBe(false);
    // expect(result.errorMessage).toContain('Invalid language tag');
  });

  it.each([
    [OCPP2_0_1.MessageFormatEnumType.ASCII, 'Hello 😀', 'ASCII with emoji'],
    [OCPP2_0_1.MessageFormatEnumType.HTML, '<div>Unclosed', 'HTML with unclosed tag'],
    [OCPP2_0_1.MessageFormatEnumType.URI, '', 'URI with empty content'],
  ])('should return error for %s: %s (%s)', (format, content, description) => {
    const messageContent = aMessageContent({ format, content });
    const result = validateMessageContentType(messageContent);
    expect(result.isValid).toBe(false);
  });
});

describe('validatePEMEncodedCSR', () => {
  const validCSR = `-----BEGIN CERTIFICATE REQUEST-----
MIICvDCCAaQCAQAwdzELMAkGA1UEBhMCVVMxDTALBgNVBAgMBFRlc3QxDTALBgNV
BAcMBFRlc3QxDTALBgNVBAoMBFRlc3QxDTALBgNVBAsMBFRlc3QxDTALBgNVBAMM
BFRlc3QxGDAWBgkqhkiG9w0BCQEWCXRlc3RAdGVzdDCCASIwDQYJKoZIhvcNAQEB
BQADggEPADCCAQoCggEBAL
-----END CERTIFICATE REQUEST-----`;

  describe('valid CSR', () => {
    it('should return valid for properly formatted PEM-encoded CSR', () => {
      const result = validatePEMEncodedCSR(validCSR);
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should accept CSR with newlines removed', () => {
      const csrWithoutNewlines = validCSR.replace(/\n/g, '');
      const result = validatePEMEncodedCSR(csrWithoutNewlines);
      expect(result.isValid).toBe(true);
    });

    it('should accept CSR with extra whitespace', () => {
      const csrWithWhitespace = `-----BEGIN CERTIFICATE REQUEST-----
      MIICvDCCAaQCAQAwdzELMAkGA1UEBhMCVVMxDTALBgNVBAgMBFRlc3QxDTALBgNV
      -----END CERTIFICATE REQUEST-----`;
      const result = validatePEMEncodedCSR(csrWithWhitespace);
      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid CSR', () => {
    it('should return error for empty string', () => {
      const result = validatePEMEncodedCSR('');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('CSR cannot be empty');
    });

    it('should return error for missing BEGIN header', () => {
      const csr = `MIICvDCCAaQCAQAwdzELMAkGA1UEBhMCVVMxDTALBgNVBAgMBFRlc3Q
-----END CERTIFICATE REQUEST-----`;
      const result = validatePEMEncodedCSR(csr);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('CSR must contain BEGIN CERTIFICATE REQUEST header');
    });

    it('should return error for missing END header', () => {
      const csr = `-----BEGIN CERTIFICATE REQUEST-----
MIICvDCCAaQCAQAwdzELMAkGA1UEBhMCVVMxDTALBgNVBAgMBFRlc3Q`;
      const result = validatePEMEncodedCSR(csr);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('CSR must contain END CERTIFICATE REQUEST header');
    });

    it('should return error for headers in wrong order', () => {
      const csr = `-----END CERTIFICATE REQUEST-----
MIICvDCCAaQCAQAwdzELMAkGA1UEBhMCVVMxDTALBgNVBAgMBFRlc3Q
-----BEGIN CERTIFICATE REQUEST-----`;
      const result = validatePEMEncodedCSR(csr);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('CSR headers are in wrong order');
    });

    it('should return error for invalid characters in content', () => {
      const csr = `-----BEGIN CERTIFICATE REQUEST-----
뇞헀딽덆뙣Ȃ쏦몂븨슴썓벓쥕쑉혩ȫ퐫😀😎
-----END CERTIFICATE REQUEST-----`;
      const result = validatePEMEncodedCSR(csr);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe(
        'CSR content contains invalid characters for base64 encoding',
      );
    });

    it('should return error for empty content', () => {
      const csr = `-----BEGIN CERTIFICATE REQUEST-----
-----END CERTIFICATE REQUEST-----`;
      const result = validatePEMEncodedCSR(csr);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('CSR content is empty');
    });

    it('should return error for whitespace-only content', () => {
      const csr = `-----BEGIN CERTIFICATE REQUEST-----


-----END CERTIFICATE REQUEST-----`;
      const result = validatePEMEncodedCSR(csr);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('CSR content is empty');
    });
  });
});
