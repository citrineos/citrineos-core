import {
    OCPP1_6,
} from '@citrineos/base';

export class AuthorizationMapper {
    static toStartTransactionResponseStatus(status: string): OCPP1_6.StartTransactionResponseStatus {
        switch (status) {
            case "Accepted":
                return OCPP1_6.StartTransactionResponseStatus.Accepted;
            case "Blocked":
                return OCPP1_6.StartTransactionResponseStatus.Blocked;
            case "ConcurrentTx":
                return OCPP1_6.StartTransactionResponseStatus.ConcurrentTx;
            case "Expired":
                return OCPP1_6.StartTransactionResponseStatus.Expired;
            case "Invalid":
                return OCPP1_6.StartTransactionResponseStatus.Invalid;
            default:
                throw new Error('Unknown StartTransactionResponse status');
        }
    }
}

