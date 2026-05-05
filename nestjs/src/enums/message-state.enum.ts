// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * OCPP frame role. String values match what legacy stores in
 * `OCPPMessages.state` (varchar). `Error` is the local extension for
 * CALL_ERROR frames (legacy treats those as Response with extra fields).
 */
export enum MessageState {
  Request = 'Request',
  Response = 'Response',
  Error = 'Error',
}
