<template>
	<router-link :to="`/wallet/${walletAddress}/deposit/${protocolId}/${assetId}`">
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

export default {
	components: {
		Row,
	},
	props: {
		walletId: {
			type: Number,
			default: 0,
		},
		protocolId: {
			type: String,
			default: '',
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
		rate: {
			type: String,
			default: '0',
		},
	},
	computed: {
		title() {
			return Formatter.formatProtocol(this.protocolId);
		},
		subtitle() {
			return Formatter.formatRate(this.rate);
		},
		ticker() {
			return Formatter.formatTicker(this.assetId);
		},
		walletAddress() {
			const walletList = Storage.getWalletList();
			return walletList[this.walletId].address;
		},
	},
};
</script>
