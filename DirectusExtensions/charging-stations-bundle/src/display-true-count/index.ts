// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { defineDisplay, useStores } from '@directus/extensions-sdk';
import DisplayComponent from './display.vue';
import { DeepPartial, Field, FieldMeta } from '@directus/types';

export default defineDisplay({
  id: 'directus-display-true-count',
  name: 'Count Present or True',
  icon: '123',
  description: 'Count present or true rows in a column',
  component: DisplayComponent,
  options: ({ editing, relations }) => {
    const relatedCollection =
      relations.o2m?.meta?.junction_field != null
        ? relations.m2o?.related_collection
        : relations.o2m?.collection;

    const junction_table =
      relations.o2m?.meta?.junction_field != null ? relations.o2m?.collection : null;
    const { useFieldsStore } = useStores();
    const fieldsStore = useFieldsStore();

    let fieldSelection: DeepPartial<FieldMeta>;
    if (editing === '+') {
      fieldSelection = {
        interface: 'presentation-notice',
        options: {
          text: 'Please complete the field before attempting to configure the display.',
        },
        width: 'full',
      };
    } else {
      const fields: Field[] = fieldsStore.getFieldsForCollection(relatedCollection);
      const field_choices: object[] = [];

      // console.log("fields", fields);

      fields.forEach((field) => {
        // console.log(field);
        field_choices.push({
          text: field.field,
          value: junction_table
            ? `${relations.o2m?.meta?.junction_field}.${field.field}`
            : field.field,
        });
      });

      fieldSelection = {
        interface: 'select-dropdown',
        options: {
          choices: field_choices,
        },
        width: 'full',
      };
    }

    return [
      {
        field: 'column',
        name: 'Choose a column',
        meta: fieldSelection,
      },
      {
        field: 'showTotal',
        type: 'boolean',
        name: 'Show Total',
        meta: {
          interface: 'boolean',
          options: {
            label: 'Show Total',
          },
          width: 'half',
        },
      },
      {
        field: 'totalPrefix',
        type: 'string',
        name: 'Total Prefix',
        meta: {
          interface: 'input',
          options: {
            font: 'monospace',
          },
          width: 'half',
          hidden: true,
          conditions: [
            {
              name: 'showTotalTrue',
              rule: {
                showTotal: {
                  _eq: true,
                },
              },
              hidden: false,
            },
          ],
        },
      },
      {
        field: 'suffix',
        type: 'string',
        name: 'Suffix',
        meta: {
          interface: 'input',
          options: {
            font: 'monospace',
          },
          width: 'half',
        },
      },
    ];
  },
  types: ['alias', 'string', 'uuid', 'integer', 'bigInteger', 'json'],
  localTypes: ['m2m', 'm2o', 'o2m', 'translations', 'm2a', 'file', 'files'],
  fields: (options) => {
    return [options.column];
  },
});
