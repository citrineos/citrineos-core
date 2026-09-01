// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { IdTokenEnum, OCPP2_1 } from '@citrineos/types';
import { AuthorizationMapper } from '@dal/mappers/2.1/index.js';
import { describe, expect, it } from 'vitest';
import { aAuthorization } from '../../providers/Authorization.js';

describe('AuthorizationMapper (2.1)', () => {
  describe('toIdTokenInfo', () => {
    it('should map groupIdToken from the eager-loaded groupAuthorization', () => {
      const group = aAuthorization((auth) => {
        auth.idToken = 'GROUP';
        auth.idTokenType = IdTokenEnum.Central;
        return auth;
      });
      const authorization = aAuthorization((auth) => {
        auth.groupAuthorization = group;
        return auth;
      });

      const result = AuthorizationMapper.toIdTokenInfo(authorization);

      expect(result.groupIdToken).toEqual({
        customData: group.customData,
        additionalInfo: group.additionalInfo,
        idToken: 'GROUP',
        type: OCPP2_1.IdTokenEnumType.Central,
      });
    });

    it('should omit groupIdToken when groupAuthorization is not loaded', () => {
      const authorization = aAuthorization((auth) => {
        auth.groupAuthorization = undefined;
        return auth;
      });

      expect(AuthorizationMapper.toIdTokenInfo(authorization).groupIdToken).toBeUndefined();
    });
  });
});
