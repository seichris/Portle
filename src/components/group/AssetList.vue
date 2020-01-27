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
			<Row
				v-for="asset in sortedAssets"
				:key="asset.walletId + '-' + asset.id"
				:wallet-id="asset.walletId"
				:amount="asset.amount"
				:ticker="formatAsset(asset.id)"
				:title="asset.name"
				:price="asset.price"
				@click.native="openAsset(asset)"
			/>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import AssetCard from '../card/AssetCard.vue';
import Row from '../Row.vue';

import Converter from '../../utils/converter.js';
import Formatter from '../../utils/formatter.js';
import Storage from '../../utils/storage.js';

import tokens from '../../data/tokens.json';

export default {
	components: {
		AssetCard,
		Row,
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
	methods: {
		openAsset(asset) {
			const { walletId, id } = asset;
			const walletList = Storage.getWalletList();
			const walletAddress = walletList[walletId].address;
			const path = `/wallet/${walletAddress}/asset/${id}`;
			this.$router.push(path);
		},
		formatAsset(assetId) {
			return Formatter.formatAsset(assetId);
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