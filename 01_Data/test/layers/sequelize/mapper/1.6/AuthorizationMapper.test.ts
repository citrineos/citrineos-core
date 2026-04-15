// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { AuthorizationStatusEnum, OCPP1_6 } from '@citrineos/base';
import { describe, expect, it } from 'vitest';
import { AuthorizationMapper } from '../../../../../src/layers/sequelize/mapper/1.6';

describe('AuthorizationMapper', () => {
  describe('toIdTagInfoStatus', () => {
    it('should correctly map AuthorizationStatusType to AuthorizeResponseStatus', () => {
      expect(AuthorizationMapper.toIdTagInfoStatus(AuthorizationStatusEnum.Accepted)).toBe(
        OCPP1_6.AuthorizeResponseStatus.Accepted,
      );
      expect(AuthorizationMapper.toIdTagInfoStatus(AuthorizationStatusEnum.Blocked)).toBe(
        OCPP1_6.AuthorizeResponseStatus.Blocked,
      );
      expect(AuthorizationMapper.toIdTagInfoStatus(AuthorizationStatusEnum.Expired)).toBe(
        OCPP1_6.AuthorizeResponseStatus.Expired,
      );
      expect(AuthorizationMapper.toIdTagInfoStatus(AuthorizationStatusEnum.Invalid)).toBe(
        OCPP1_6.AuthorizeResponseStatus.Invalid,
      );
    });

    it('should throw an error for unmapped statuses', () => {
      expect(() => AuthorizationMapper.toIdTagInfoStatus('ConcurrentTx')).toThrow(
        'Unknown IdTagInfoStatus status',
      );
    });
  });

  describe('toStartTransactionResponseStatus', () => {
    it('should correctly map AuthorizationStatusType to StartTransactionResponseStatus', () => {
      expect(
        AuthorizationMapper.toStartTransactionResponseStatus(AuthorizationStatusEnum.Accepted),
      ).toBe(OCPP1_6.StartTransactionResponseStatus.Accepted);
      expect(
        AuthorizationMapper.toStartTransactionResponseStatus(AuthorizationStatusEnum.Blocked),
      ).toBe(OCPP1_6.StartTransactionResponseStatus.Blocked);
      expect(
        AuthorizationMapper.toStartTransactionResponseStatus(AuthorizationStatusEnum.ConcurrentTx),
      ).toBe(OCPP1_6.StartTransactionResponseStatus.ConcurrentTx);
      expect(
        AuthorizationMapper.toStartTransactionResponseStatus(AuthorizationStatusEnum.Expired),
      ).toBe(OCPP1_6.StartTransactionResponseStatus.Expired);
      expect(
        AuthorizationMapper.toStartTransactionResponseStatus(AuthorizationStatusEnum.Invalid),
      ).toBe(OCPP1_6.StartTransactionResponseStatus.Invalid);
    });

    it('should throw an error for unmapped statuses', () => {
      expect(() =>
        AuthorizationMapper.toStartTransactionResponseStatus(AuthorizationStatusEnum.NoCredit),
      ).toThrow('Unknown StartTransactionResponse status');
    });
  });
});
