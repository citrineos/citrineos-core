// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import tseslint from 'typescript-eslint';
import { sharedConfigs, sharedIgnores } from '../../../eslint.config.base.js';

export default tseslint.config(...sharedConfigs, sharedIgnores);
