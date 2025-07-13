import { AuthorizationStatusEnumType, OCPP1_6 } from '@citrineos/base';
import { AuthorizationMapper } from '../../../../../src/layers/sequelize/mapper/1.6';

describe('AuthorizationMapper', () => {
  describe('toIdTagInfoStatus', () => {
    it('should correctly map AuthorizationStatusEnumType to AuthorizeResponseStatus', () => {
      expect(AuthorizationMapper.toIdTagInfoStatus(AuthorizationStatusEnumType.Accepted)).toBe(
        OCPP1_6.AuthorizeResponseStatus.Accepted,
      );
      expect(AuthorizationMapper.toIdTagInfoStatus(AuthorizationStatusEnumType.Blocked)).toBe(
        OCPP1_6.AuthorizeResponseStatus.Blocked,
      );
      expect(AuthorizationMapper.toIdTagInfoStatus(AuthorizationStatusEnumType.Expired)).toBe(
        OCPP1_6.AuthorizeResponseStatus.Expired,
      );
      expect(AuthorizationMapper.toIdTagInfoStatus(AuthorizationStatusEnumType.Invalid)).toBe(
        OCPP1_6.AuthorizeResponseStatus.Invalid,
      );
    });

    it('should throw an error for unmapped statuses', () => {
      expect(() =>
        AuthorizationMapper.toIdTagInfoStatus(AuthorizationStatusEnumType.ConcurrentTx),
      ).toThrow('Unknown IdTagInfoStatus status');
    });
  });

  describe('toStartTransactionResponseStatus', () => {
    it('should correctly map AuthorizationStatusEnumType to StartTransactionResponseStatus', () => {
      expect(
        AuthorizationMapper.toStartTransactionResponseStatus(AuthorizationStatusEnumType.Accepted),
      ).toBe(OCPP1_6.StartTransactionResponseStatus.Accepted);
      expect(
        AuthorizationMapper.toStartTransactionResponseStatus(AuthorizationStatusEnumType.Blocked),
      ).toBe(OCPP1_6.StartTransactionResponseStatus.Blocked);
      expect(
        AuthorizationMapper.toStartTransactionResponseStatus(
          AuthorizationStatusEnumType.ConcurrentTx,
        ),
      ).toBe(OCPP1_6.StartTransactionResponseStatus.ConcurrentTx);
      expect(
        AuthorizationMapper.toStartTransactionResponseStatus(AuthorizationStatusEnumType.Expired),
      ).toBe(OCPP1_6.StartTransactionResponseStatus.Expired);
      expect(
        AuthorizationMapper.toStartTransactionResponseStatus(AuthorizationStatusEnumType.Invalid),
      ).toBe(OCPP1_6.StartTransactionResponseStatus.Invalid);
    });

    it('should throw an error for unmapped statuses', () => {
      expect(() =>
        AuthorizationMapper.toStartTransactionResponseStatus(AuthorizationStatusEnumType.NoCredit),
      ).toThrow('Unknown StartTransactionResponse status');
    });
  });
});
