<template>
	<div id="list">
		<VerticalWalletList
			id="vertical-list"
			:wallets="wallets"
			:selected-wallet="selectedWallet"
			:prices="prices"
			:components="components"
		/>
		<HorizontalWalletList
			id="horizontal-list"
			:wallets="wallets"
			:selected-wallet="selectedWallet"
			:prices="prices"
			:components="components"
		/>
	</div>
</template>

<script>
import VerticalWalletList from './VerticalWalletList.vue';
import HorizontalWalletList from './HorizontalWalletList.vue';

export default {
	components: {
		VerticalWalletList,
		HorizontalWalletList,
	},
	props: {
		wallets: {
			type: Array,
			default: () => [],
		},
		selectedWallet: {
			type: Number,
			default: -1,
		},
		prices: {
			type: Object,
			default: () => {},
		},
		components: {
			type: Object,
			default: () => {},
		},
	},
};
</script>

<style scoped>
#list {
	display: flex;
	flex-direction: column;
	padding: 1.5em 1em;
}

#horizontal-list {
	display: none;
}

@media all and (max-width: 1024px) {
	#vertical-list {
		display: none;
	}

	#horizontal-list {
		display: flex;
		flex-direction: row;
		background: var(--brand-color);
		color: var(--inverted-primary-text-color);
		overflow-x: auto;
		padding: 0 1em 0.75em 1em;
	}
}
</style>
