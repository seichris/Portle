<template>
	<router-link :to="`/wallet/${walletAddress}/asset/${assetId}`">
		<Row
			:wallet-id="walletId"
			:amount="amount"
			:ticker="ticker"
			:title="title"
			:subtitle="subtitle"
			:price="price"
		/>
	</router-link>
</template>

<script>
import Row from './Row.vue';

import Formatter from '../../utils/formatter.js';
import Storage from '../../utils/storage.js';

import tokens from '../../data/tokens.json';

export default {
	components: {
		Row,
	},
	props: {
		walletId: {
			type: Number,
			default: 0,
		},
		assetId: {
			type: String,
			default: '',
		},
		amount: {
			type: String,
			default: '0',
		},
		price: {
			type: Number,
			default: 0,
		},
	},
	computed: {
		title() {
			const assetTitle = tokens[this.assetId];
			return assetTitle;
		},
		subtitle() {
			const priceString = Formatter.formatMoney(this.price);
			return `${priceString}/`;
		},
		ticker() {
			return Formatter.formatAsset(this.assetId);
		},
		walletAddress() {
			const walletList = Storage.getWalletList();
			return walletList[this.walletId].address;
		},
	},
};
</script>
