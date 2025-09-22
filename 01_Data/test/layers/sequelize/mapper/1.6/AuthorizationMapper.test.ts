// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AuthorizationStatusType, OCPP1_6 } from '@citrineos/base';
import { AuthorizationMapper } from '../../../../../src/layers/sequelize/mapper/1.6';

describe('AuthorizationMapper', () => {
  describe('toIdTagInfoStatus', () => {
    it('should correctly map AuthorizationStatusType to AuthorizeResponseStatus', () => {
      expect(AuthorizationMapper.toIdTagInfoStatus(AuthorizationStatusType.Accepted)).toBe(
        OCPP1_6.AuthorizeResponseStatus.Accepted,
      );
      expect(AuthorizationMapper.toIdTagInfoStatus(AuthorizationStatusType.Blocked)).toBe(
        OCPP1_6.AuthorizeResponseStatus.Blocked,
      );
      expect(AuthorizationMapper.toIdTagInfoStatus(AuthorizationStatusType.Expired)).toBe(
        OCPP1_6.AuthorizeResponseStatus.Expired,
      );
      expect(AuthorizationMapper.toIdTagInfoStatus(AuthorizationStatusType.Invalid)).toBe(
        OCPP1_6.AuthorizeResponseStatus.Invalid,
      );
    });

    it('should throw an error for unmapped statuses', () => {
      expect(() =>
        AuthorizationMapper.toIdTagInfoStatus(AuthorizationStatusType.ConcurrentTx),
      ).toThrow('Unknown IdTagInfoStatus status');
    });
  });

  describe('toStartTransactionResponseStatus', () => {
    it('should correctly map AuthorizationStatusType to StartTransactionResponseStatus', () => {
      expect(
        AuthorizationMapper.toStartTransactionResponseStatus(AuthorizationStatusType.Accepted),
      ).toBe(OCPP1_6.StartTransactionResponseStatus.Accepted);
      expect(
        AuthorizationMapper.toStartTransactionResponseStatus(AuthorizationStatusType.Blocked),
      ).toBe(OCPP1_6.StartTransactionResponseStatus.Blocked);
      expect(
        AuthorizationMapper.toStartTransactionResponseStatus(AuthorizationStatusType.ConcurrentTx),
      ).toBe(OCPP1_6.StartTransactionResponseStatus.ConcurrentTx);
      expect(
        AuthorizationMapper.toStartTransactionResponseStatus(AuthorizationStatusType.Expired),
      ).toBe(OCPP1_6.StartTransactionResponseStatus.Expired);
      expect(
        AuthorizationMapper.toStartTransactionResponseStatus(AuthorizationStatusType.Invalid),
      ).toBe(OCPP1_6.StartTransactionResponseStatus.Invalid);
    });

    it('should throw an error for unmapped statuses', () => {
      expect(() =>
        AuthorizationMapper.toStartTransactionResponseStatus(AuthorizationStatusType.NoCredit),
      ).toThrow('Unknown StartTransactionResponse status');
    });
  });
});
