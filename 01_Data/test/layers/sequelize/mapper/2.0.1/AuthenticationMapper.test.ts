// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AuthorizationStatusType, IdTokenType, OCPP2_0_1 } from '@citrineos/base';
import { AuthorizationMapper } from '../../../../../src/layers/sequelize/mapper/2.0.1';
import { aAuthorization } from '../../../../providers/Authorization';

// Helper function to validate common structure
const validateIdToken = (result: any, authorization: any) => {
  expect(result).toHaveProperty('idToken', authorization.idToken);
  expect(result).toHaveProperty('type', authorization.idTokenType);
};

describe('AuthenticationMapper', () => {
  describe('toAuthorizationData', () => {
    it('should map Authorization to AuthorizationData correctly', () => {
      const authorization = aAuthorization();
      const result = AuthorizationMapper.toAuthorizationData(authorization);
      expect(result).toHaveProperty('customData');
      validateIdToken(result.idToken, authorization);
      expect(result).toHaveProperty('idTokenInfo');
    });
  });

  describe('toIdToken', () => {
    it('should map Authorization to the correct idToken format', () => {
      const authorization = aAuthorization();
      const result = AuthorizationMapper.toIdToken(authorization);
      validateIdToken(result, authorization);
      expect(result).toHaveProperty('additionalInfo');
    });

    it('should map additionalInfo if present', () => {
      const authorization = aAuthorization((auth) => {
        auth.additionalInfo = [{ additionalIdToken: 'value', type: 'key' }];
        return auth;
      });
      const result = AuthorizationMapper.toIdToken(authorization);
      expect(result).toHaveProperty('additionalInfo');
      expect(result.additionalInfo).toEqual([{ additionalIdToken: 'value', type: 'key' }]);
    });
  });

  describe('Enum Mappings', () => {
    describe('toAuthorizationStatusEnumType', () => {
      const statuses = [
        {
          input: AuthorizationStatusType.Accepted,
          output: OCPP2_0_1.AuthorizationStatusEnumType.Accepted,
        },
        {
          input: AuthorizationStatusType.Blocked,
          output: OCPP2_0_1.AuthorizationStatusEnumType.Blocked,
        },
        {
          input: AuthorizationStatusType.ConcurrentTx,
          output: OCPP2_0_1.AuthorizationStatusEnumType.ConcurrentTx,
        },
        {
          input: AuthorizationStatusType.Expired,
          output: OCPP2_0_1.AuthorizationStatusEnumType.Expired,
        },
        {
          input: AuthorizationStatusType.Invalid,
          output: OCPP2_0_1.AuthorizationStatusEnumType.Invalid,
        },
        {
          input: AuthorizationStatusType.NoCredit,
          output: OCPP2_0_1.AuthorizationStatusEnumType.NoCredit,
        },
        {
          input: AuthorizationStatusType.NotAllowedTypeEVSE,
          output: OCPP2_0_1.AuthorizationStatusEnumType.NotAllowedTypeEVSE,
        },
        {
          input: AuthorizationStatusType.NotAtThisLocation,
          output: OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisLocation,
        },
        {
          input: AuthorizationStatusType.NotAtThisTime,
          output: OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisTime,
        },
        {
          input: AuthorizationStatusType.Unknown,
          output: OCPP2_0_1.AuthorizationStatusEnumType.Unknown,
        },
      ];

      statuses.forEach(({ input, output }) => {
        it(`should map ${input} to ${output}`, () => {
          const result = AuthorizationMapper.fromAuthorizationStatusType(input);
          expect(result).toBe(output);
        });
      });

      it('should throw an error for unknown statuses', () => {
        expect(() =>
          AuthorizationMapper.fromAuthorizationStatusType(
            'InvalidStatus' as AuthorizationStatusType,
          ),
        ).toThrow('Unknown authorization status');
      });
    });

    describe('fromAuthorizationStatusType', () => {
      const statuses = [
        {
          input: OCPP2_0_1.AuthorizationStatusEnumType.Accepted,
          output: AuthorizationStatusType.Accepted,
        },
        {
          input: OCPP2_0_1.AuthorizationStatusEnumType.Blocked,
          output: AuthorizationStatusType.Blocked,
        },
        {
          input: OCPP2_0_1.AuthorizationStatusEnumType.ConcurrentTx,
          output: AuthorizationStatusType.ConcurrentTx,
        },
        {
          input: OCPP2_0_1.AuthorizationStatusEnumType.Expired,
          output: AuthorizationStatusType.Expired,
        },
        {
          input: OCPP2_0_1.AuthorizationStatusEnumType.Invalid,
          output: AuthorizationStatusType.Invalid,
        },
        {
          input: OCPP2_0_1.AuthorizationStatusEnumType.NoCredit,
          output: AuthorizationStatusType.NoCredit,
        },
        {
          input: OCPP2_0_1.AuthorizationStatusEnumType.NotAllowedTypeEVSE,
          output: AuthorizationStatusType.NotAllowedTypeEVSE,
        },
        {
          input: OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisLocation,
          output: AuthorizationStatusType.NotAtThisLocation,
        },
        {
          input: OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisTime,
          output: AuthorizationStatusType.NotAtThisTime,
        },
        {
          input: OCPP2_0_1.AuthorizationStatusEnumType.Unknown,
          output: AuthorizationStatusType.Unknown,
        },
      ];

      statuses.forEach(({ input, output }) => {
        it(`should map ${input} to ${output}`, () => {
          const result = AuthorizationMapper.toAuthorizationStatusType(input);
          expect(result).toBe(output);
        });
      });

      it('should throw an error for unknown statuses', () => {
        expect(() =>
          AuthorizationMapper.toAuthorizationStatusType(
            'InvalidStatus' as OCPP2_0_1.AuthorizationStatusEnumType,
          ),
        ).toThrow('Unknown authorization status');
      });
    });

    describe('toIdTokenEnumType', () => {
      const tokenTypes = [
        { input: IdTokenType.Central, output: OCPP2_0_1.IdTokenEnumType.Central },
        { input: IdTokenType.eMAID, output: OCPP2_0_1.IdTokenEnumType.eMAID },
        { input: IdTokenType.ISO14443, output: OCPP2_0_1.IdTokenEnumType.ISO14443 },
        { input: IdTokenType.ISO15693, output: OCPP2_0_1.IdTokenEnumType.ISO15693 },
        { input: IdTokenType.KeyCode, output: OCPP2_0_1.IdTokenEnumType.KeyCode },
        { input: IdTokenType.Local, output: OCPP2_0_1.IdTokenEnumType.Local },
        { input: IdTokenType.MacAddress, output: OCPP2_0_1.IdTokenEnumType.MacAddress },
        { input: IdTokenType.NoAuthorization, output: OCPP2_0_1.IdTokenEnumType.NoAuthorization },
        { input: IdTokenType.Other, output: OCPP2_0_1.IdTokenEnumType.Central }, // Other maps to Central
      ];

      tokenTypes.forEach(({ input, output }) => {
        it(`should return ${output} for type ${input}`, () => {
          const result = AuthorizationMapper.toIdTokenEnumType(input);
          expect(result).toBe(output);
        });
      });

      it('should throw an error for unknown types', () => {
        expect(() =>
          AuthorizationMapper.toIdTokenEnumType('InvalidType' as unknown as IdTokenType),
        ).toThrow('Unknown idToken type');
      });
    });

    describe('fromIdTokenEnumType', () => {
      const tokenTypes = [
        { input: OCPP2_0_1.IdTokenEnumType.Central, output: IdTokenType.Central },
        { input: OCPP2_0_1.IdTokenEnumType.eMAID, output: IdTokenType.eMAID },
        { input: OCPP2_0_1.IdTokenEnumType.ISO14443, output: IdTokenType.ISO14443 },
        { input: OCPP2_0_1.IdTokenEnumType.ISO15693, output: IdTokenType.ISO15693 },
        { input: OCPP2_0_1.IdTokenEnumType.KeyCode, output: IdTokenType.KeyCode },
        { input: OCPP2_0_1.IdTokenEnumType.Local, output: IdTokenType.Local },
        { input: OCPP2_0_1.IdTokenEnumType.MacAddress, output: IdTokenType.MacAddress },
        { input: OCPP2_0_1.IdTokenEnumType.NoAuthorization, output: IdTokenType.NoAuthorization },
      ];

      tokenTypes.forEach(({ input, output }) => {
        it(`should return ${output} for type ${input}`, () => {
          const result = AuthorizationMapper.fromIdTokenEnumType(input);
          expect(result).toBe(output);
        });
      });
    });

    describe('toMessageFormatEnum', () => {
      const formats = [
        { input: 'ASCII', output: OCPP2_0_1.MessageFormatEnumType.ASCII },
        { input: 'HTML', output: OCPP2_0_1.MessageFormatEnumType.HTML },
        { input: 'URI', output: OCPP2_0_1.MessageFormatEnumType.URI },
        { input: 'UTF8', output: OCPP2_0_1.MessageFormatEnumType.UTF8 },
      ];

      formats.forEach(({ input, output }) => {
        it(`should return ${output} for format ${input}`, () => {
          const result = AuthorizationMapper.toMessageFormatEnum(input);
          expect(result).toBe(output);
        });
      });

      it('should throw an error for unknown message formats', () => {
        expect(() => AuthorizationMapper.toMessageFormatEnum('UnknownFormat')).toThrow(
          'Unknown message format',
        );
      });
    });
  });

  describe('toMessageContentType', () => {
    it('should map valid message content correctly', () => {
      const messageContent = {
        customData: { key: 'value' },
        format: 'ASCII',
        language: 'en',
        content: 'Hello World',
      };

      const result = AuthorizationMapper.toMessageContentType(messageContent);

      expect(result).toEqual({
        customData: { key: 'value' },
        format: OCPP2_0_1.MessageFormatEnumType.ASCII,
        language: 'en',
        content: 'Hello World',
      });
    });

    it('should handle undefined customData, language, or content', () => {
      const messageContent = {
        format: 'HTML',
      };

      const result = AuthorizationMapper.toMessageContentType(messageContent);

      expect(result).toEqual({
        customData: undefined,
        format: OCPP2_0_1.MessageFormatEnumType.HTML,
        language: undefined,
        content: undefined,
      });
    });

    it('should throw an error for an unknown format', () => {
      const messageContent = {
        customData: { key: 'value' },
        format: 'INVALID_FORMAT',
        language: 'en',
        content: 'Hello World',
      };

      expect(() => AuthorizationMapper.toMessageContentType(messageContent)).toThrow(
        'Unknown message format',
      );
    });
  });
});
