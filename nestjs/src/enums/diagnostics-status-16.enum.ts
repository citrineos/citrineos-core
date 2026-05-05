// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/** OCPP 1.6 DiagnosticsStatus — a charger reports diagnostic upload progress. */
export enum DiagnosticsStatus16 {
  Idle = 'Idle',
  Uploaded = 'Uploaded',
  UploadFailed = 'UploadFailed',
  Uploading = 'Uploading',
}
