<template>
	<div>
		<div id="list">
			<AssetCard
				v-for="asset in sortedAssets"
				:key="asset.walletId + '-' + asset.id"
				:amount="asset.amount"
				:asset-id="asset.id"
				:wallet-id="asset.walletId"
				:price="asset.price"
			/>
		</div>
		<div id="table">
			<AssetRow
				v-for="asset in sortedAssets"
				:key="asset.walletId + '-' + asset.id"
				:wallet-id="asset.walletId"
				:amount="asset.amount"
				:asset-id="asset.id"
				:price="asset.price"
			/>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import AssetCard from '../card/AssetCard.vue';
import AssetRow from '../row/AssetRow.vue';

import Converter from '../../utils/converter.js';

import tokens from '../../data/tokens.json';

export default {
	components: {
		AssetCard,
		AssetRow,
	},
	props: {
		assets: {
			type: Array,
			default: () => [],
		},
		prices: {
			type: Object,
			default: () => {},
		},
	},
	computed: {
		sortedAssets() {
			const assets = [];
			for (const rawAsset of this.assets) {
				const { walletId, id, balance } = rawAsset;
				const name = tokens[id];
				const price = this.prices[id] || '0';
				const amount = Converter.toAmount(balance, id);
				const amountNumber = new BigNumber(amount);
				const value = amountNumber.times(price).toString();
				const asset = {
					walletId,
					id,
					name,
					amount,
					price,
					value,
				};
				assets.push(asset);
			}
			assets.sort((a, b) => {
				const aValue = new BigNumber(a.value);
				const bValue = new BigNumber(b.value);
				return aValue.lt(bValue)
					? 1
					: aValue.gt(bValue)
						? -1
						: 0;
			});
			const meaningfulAssets = assets.filter(asset => {
				const value = new BigNumber(asset.value);
				return value.gt(1);
			});
			return meaningfulAssets;
		},
	},
};
</script>

<style scoped>
#list {
	display: flex;
	flex-wrap: wrap;
}

#table {
	display: none;
}

@media (max-width: 767px) {
	#list {
		display: none;
	}

	#table {
		display: initial;
	}
}
</style>
