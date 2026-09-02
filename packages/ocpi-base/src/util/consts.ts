// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

export const EVSE_COMPONENT = 'EVSE';
export const CONNECTOR_COMPONENT = 'Connector';
export const AUTH_CONTROLLER_COMPONENT = 'AuthCtrlr';
export const TOKEN_READER_COMPONENT = 'TokenReader';
export const AVAILABILITY_STATE_VARIABLE = 'AvailabilityState';
export const UNKNOWN_ID = 'UNKNOWN';
export const NOT_APPLICABLE = 'N/A';
export const MINUTES_IN_HOUR = 60;
export const CREATE = 'create';
export const UPDATE = 'update';
export const COMMAND_RESPONSE_URL_CACHE_NAMESPACE = 'commands';
/**
 * Used to replace response url in cache so that the timeout handler knows the command
 * was resolved instead of timed out and doesn't attempt to send a command result.
 */
export const COMMAND_RESPONSE_URL_CACHE_RESOLVED = 'resolved';
