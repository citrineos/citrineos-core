// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type { AuthorizationStatusType } from '@citrineos/base';
import { OCPP1_6 } from '@citrineos/base';
import { AuthorizationMapper } from '../../../../../src/layers/sequelize/mapper/1.6';
import { describe, expect, it } from 'vitest';

describe('AuthorizationMapper', () => {
  describe('toIdTagInfoStatus', () => {
    it('should correctly map AuthorizationStatusType to AuthorizeResponseStatus', () => {
      expect(AuthorizationMapper.toIdTagInfoStatus('Accepted')).toBe(
        OCPP1_6.AuthorizeResponseStatus.Accepted,
      );
      expect(AuthorizationMapper.toIdTagInfoStatus('Blocked')).toBe(
        OCPP1_6.AuthorizeResponseStatus.Blocked,
      );
      expect(AuthorizationMapper.toIdTagInfoStatus('Expired')).toBe(
        OCPP1_6.AuthorizeResponseStatus.Expired,
      );
      expect(AuthorizationMapper.toIdTagInfoStatus('Invalid')).toBe(
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
      expect(AuthorizationMapper.toStartTransactionResponseStatus('Accepted')).toBe(
        OCPP1_6.StartTransactionResponseStatus.Accepted,
      );
      expect(AuthorizationMapper.toStartTransactionResponseStatus('Blocked')).toBe(
        OCPP1_6.StartTransactionResponseStatus.Blocked,
      );
      expect(AuthorizationMapper.toStartTransactionResponseStatus('ConcurrentTx')).toBe(
        OCPP1_6.StartTransactionResponseStatus.ConcurrentTx,
      );
      expect(AuthorizationMapper.toStartTransactionResponseStatus('Expired')).toBe(
        OCPP1_6.StartTransactionResponseStatus.Expired,
      );
      expect(AuthorizationMapper.toStartTransactionResponseStatus('Invalid')).toBe(
        OCPP1_6.StartTransactionResponseStatus.Invalid,
      );
    });

    it('should throw an error for unmapped statuses', () => {
      expect(() => AuthorizationMapper.toStartTransactionResponseStatus('NoCredit')).toThrow(
        'Unknown StartTransactionResponse status',
      );
    });
  });
});
