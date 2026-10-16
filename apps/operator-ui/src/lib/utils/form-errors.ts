// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

// A FieldError has a string `type` (a field may itself be named "type", holding an object) and an
// optional `message`; anything else is a nested field or array. Never descend into a FieldError,
// whose `ref` is a DOM node.
export const formErrorMessages = (errors: unknown): string[] => {
  if (!errors || typeof errors !== 'object') return [];
  if ('type' in errors && typeof errors.type === 'string') {
    return 'message' in errors && typeof errors.message === 'string' && errors.message
      ? [errors.message]
      : [];
  }
  return [...new Set(Object.values(errors).flatMap(formErrorMessages))];
};
