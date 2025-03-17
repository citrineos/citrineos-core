import { OCPP2_0_1 } from '@citrineos/base';
import { AuthorizationMapper } from '../../../../../src/layers/sequelize/mapper/2.0.1';
import {
  aAuthorization,
  aIdToken,
  aIdTokenInfo,
  aAdditionalInfo,
} from '../../../../providers/Authorization';

describe('AuthenticationMapper', () => {
  // Helper function to validate common structure
  const validateIdToken = (result: any, idToken: any) => {
    expect(result).toHaveProperty('idToken', idToken.idToken);
    expect(result).toHaveProperty('type', idToken.type);
  };

  describe('toAuthorizationData', () => {
    it('should map Authorization to AuthorizationData correctly', () => {
      const authorization = aAuthorization();

      const result = AuthorizationMapper.toAuthorizationData(authorization);

      expect(result).toHaveProperty('customData');
      validateIdToken(result.idToken, authorization.idToken);
      expect(result).toHaveProperty('idTokenInfo');
    });
  });

  describe('toIdToken', () => {
    it('should map IdToken to the correct format', () => {
      const idToken = aIdToken();

      const result = AuthorizationMapper.toIdToken(idToken);

      validateIdToken(result, idToken);
      expect(result).toHaveProperty('additionalInfo');
    });

    it('should map additionalInfo if present', () => {
      const idToken = aIdToken((token) => {
        token.additionalInfo = [aAdditionalInfo(), aAdditionalInfo()];
        return token;
      });

      const result = AuthorizationMapper.toIdToken(idToken);

      if (result.additionalInfo) {
        expect(result.additionalInfo.length).toBe(2);
        result.additionalInfo.forEach((info: any) => {
          expect(info).toHaveProperty('additionalIdToken');
          expect(info).toHaveProperty('type');
        });
      } else {
        throw new Error('additionalInfo should not be null for this test case.');
      }
    });
  });

  describe('toAdditionalInfo', () => {
    it('should map AdditionalInfo correctly', () => {
      const additionalInfo = aAdditionalInfo();

      const result = AuthorizationMapper.toAdditionalInfo(additionalInfo);

      expect(result).toEqual(additionalInfo);
    });
  });

  describe('toIdTokenInfo', () => {
    it('should map IdTokenInfo correctly', () => {
      const authorization = aAuthorization();

      const result = AuthorizationMapper.toIdTokenInfo(authorization);

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('cacheExpiryDateTime');
      expect(result).toHaveProperty('chargingPriority');
      expect(result).toHaveProperty('language1');
      expect(result).toHaveProperty('evseId');
      expect(result).toHaveProperty('groupIdToken');
    });

    it('should handle undefined groupIdToken', () => {
      const authorization = aAuthorization((auth) => {
        auth.idTokenInfo = aIdTokenInfo((info) => {
          info.groupIdToken = undefined;
          return info;
        });
        return auth;
      });

      const result = AuthorizationMapper.toIdTokenInfo(authorization);

      expect(result.groupIdToken).toBeUndefined();
    });
  });

  describe('Enum Mappings', () => {
    describe('toAuthorizationStatusEnumType', () => {
      const statuses = [
        { input: 'Accepted', output: OCPP2_0_1.AuthorizationStatusEnumType.Accepted },
        { input: 'Blocked', output: OCPP2_0_1.AuthorizationStatusEnumType.Blocked },
        { input: 'ConcurrentTx', output: OCPP2_0_1.AuthorizationStatusEnumType.ConcurrentTx },
        { input: 'Expired', output: OCPP2_0_1.AuthorizationStatusEnumType.Expired },
        { input: 'Invalid', output: OCPP2_0_1.AuthorizationStatusEnumType.Invalid },
        { input: 'NoCredit', output: OCPP2_0_1.AuthorizationStatusEnumType.NoCredit },
        {
          input: 'NotAllowedTypeEVSE',
          output: OCPP2_0_1.AuthorizationStatusEnumType.NotAllowedTypeEVSE,
        },
        {
          input: 'NotAtThisLocation',
          output: OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisLocation,
        },
        { input: 'NotAtThisTime', output: OCPP2_0_1.AuthorizationStatusEnumType.NotAtThisTime },
        { input: 'Unknown', output: OCPP2_0_1.AuthorizationStatusEnumType.Unknown },
      ];

      statuses.forEach(({ input, output }) => {
        it(`should return ${output} for status ${input}`, () => {
          const result = AuthorizationMapper.toAuthorizationStatusEnumType(input);
          expect(result).toBe(output);
        });
      });

      it('should throw an error for unknown statuses', () => {
        expect(() => AuthorizationMapper.toAuthorizationStatusEnumType('InvalidStatus')).toThrow(
          'Unknown authorization status',
        );
      });
    });

    describe('toIdTokenEnumType', () => {
      const tokenTypes = [
        { input: 'Central', output: OCPP2_0_1.IdTokenEnumType.Central },
        { input: 'eMAID', output: OCPP2_0_1.IdTokenEnumType.eMAID },
        { input: 'ISO14443', output: OCPP2_0_1.IdTokenEnumType.ISO14443 },
        { input: 'ISO15693', output: OCPP2_0_1.IdTokenEnumType.ISO15693 },
        { input: 'KeyCode', output: OCPP2_0_1.IdTokenEnumType.KeyCode },
        { input: 'Local', output: OCPP2_0_1.IdTokenEnumType.Local },
        { input: 'MacAddress', output: OCPP2_0_1.IdTokenEnumType.MacAddress },
        { input: 'NoAuthorization', output: OCPP2_0_1.IdTokenEnumType.NoAuthorization },
      ];

      tokenTypes.forEach(({ input, output }) => {
        it(`should return ${output} for type ${input}`, () => {
          const result = AuthorizationMapper.toIdTokenEnumType(input);
          expect(result).toBe(output);
        });
      });

      it('should throw an error for unknown types', () => {
        expect(() => AuthorizationMapper.toIdTokenEnumType('InvalidType')).toThrow(
          'Unknown idToken type',
        );
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
