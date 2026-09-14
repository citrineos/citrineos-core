// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

/**
 * Type guard for Sequelize's foreign-key constraint violation. Matches by error
 * name so it holds regardless of which Sequelize instance produced the error.
 */
export function isForeignKeyConstraintError(error: unknown): boolean {
  return error instanceof Error && error.name === 'SequelizeForeignKeyConstraintError';
}
