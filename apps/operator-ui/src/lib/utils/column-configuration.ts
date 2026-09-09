// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { z } from 'zod';

export type FilterType = 'text' | 'number' | 'date' | 'yesno' | 'enum';

export type FilterConfig = {
  /** The type of input to show for this filter. */
  type: FilterType;
  /**
   * The actual Hasura/database field name to filter on.
   * Defaults to the column key if not provided.
   */
  field?: string;
  /** Human-readable label shown in the filter UI. Defaults to the column header. */
  label?: string;
  /** Options for enum-type filters. */
  enumOptions?: { label: string; value: string }[];
  /** Minimum value for number sliders. */
  min?: number;
  /** Maximum value for number sliders. */
  max?: number;
  /** Unit suffix displayed next to number values, e.g. 'kW'. */
  unit?: string;
};

const ColumnConfigurationSchema = z.object({
  key: z.string(),
  header: z.string(),
  accessorKey: z.string().optional(),
  visible: z.boolean().optional(),
  sortable: z.boolean().optional(),
  cellRender: z.any().optional(),
  filterConfig: z.any().optional(),
});

export type ColumnConfiguration = z.infer<typeof ColumnConfigurationSchema> & {
  filterConfig?: FilterConfig;
};
