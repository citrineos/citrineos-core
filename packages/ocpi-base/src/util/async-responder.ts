// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

//   async send(
//     correlationId: string,
//     data:
//       | ActiveChargingProfileResult
//       | ClearChargingProfileResult
//       | ChargingProfileResult
//       | CommandResult,
//     params?: OcpiParams,
//   ) {
//     const responseUrlEntity =
//       await this.responseUrlRepo.getResponseUrl(correlationId);
//     if (responseUrlEntity) {
//       params = params ?? responseUrlEntity.params;
//       if (!params) {
//         throw new NotFoundError(
//           `No OcpiParams found for correlationId: ${correlationId}`,
//         );
//       }

//       await this.asyncResponseApi.postAsyncResponse(
//         responseUrlEntity.responseUrl,
//         data,
//         params,
//       );
//     } else {
//       throw new NotFoundError(
//         'No response url found for correlationId: ' + correlationId,
//       );
//     }
//   }
// }
