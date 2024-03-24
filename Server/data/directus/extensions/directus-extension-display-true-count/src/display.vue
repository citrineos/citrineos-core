<template>
	<div v-if="calculatedValue">{{ calculatedValue }}{{ totalPrefix }}{{ total }}{{ suffix }}</div>
	<value-null v-else />
</template>

<script>
import { ref } from 'vue';
export default {
	props: {
		value: {
			type: String,
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

		props.value.forEach(item => {
			const columns = props.column.split('.');

			columns.forEach(col => {
				item = item[col];
			});

			if (item && (item === 'true' || item !== 'false')) {
				calculatedValue.value += 1;
			}
		});


		return { calculatedValue, total };
	},
};
</script>
