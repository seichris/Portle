<template>
	<router-link :to="`/wallet/${walletAddress}/asset/${assetId}`">
		<Row
			:amount="amount"
			:ticker="ticker"
			:wallet-id="walletId"
			:title="title"
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
		amount: {
			type: String,
			default: '0',
		},
		assetId: {
			type: String,
			default: '',
		},
		walletId: {
			type: Number,
			default: 0,
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
