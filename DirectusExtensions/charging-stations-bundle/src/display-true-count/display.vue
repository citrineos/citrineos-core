<template>
  <span>{{ calculatedValue }}{{ totalPrefix }}{{ total }}{{ suffix }}</span>
</template>

<script lang="ts">
// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import { defineComponent, ref } from 'vue';

export default defineComponent({
  props: {
    value: {
      type: Array<object | string>,
      default: null,
    },
    column: {
      type: String,
      default: null,
    },
    showTotal: {
      type: Boolean,
      default: false,
    },
    totalPrefix: {
      type: String,
      default: null,
    },
    suffix: {
      type: String,
      default: null,
    },
  },
  setup(props) {
    const calculatedValue = ref(0);
    const total = props.showTotal ? props.value.length : null;

    props.value.forEach((item) => {
      const columns = props.column.split('.');

      columns.forEach((col) => {
        item = item[col];
      });

      if (item && item !== 'false') {
        calculatedValue.value += 1;
      }
    });

    return { calculatedValue, total };
  },
});
</script>
