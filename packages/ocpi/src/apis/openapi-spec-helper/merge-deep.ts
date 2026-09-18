// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import _merge from 'lodash.merge';

export const mergeDeep = (target: any, ...sources: any[]): any => _merge(target, ...sources);
