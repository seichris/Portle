<template>
	<router-link :to="`/wallet/${walletAddress}/investment/${protocolId}/${investmentId}`">
		<Row
			:amount="amount"
			:ticker="ticker"
			:wallet-id="walletId"
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
		amount: {
			type: String,
			default: '0',
		},
		investmentId: {
			type: String,
			default: '',
		},
		protocolId: {
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
			const title = Formatter.formatProtocol(this.protocolId);
			return title;
		},
		subtitle() {
			const priceString = Formatter.formatMoney(this.price);
			return `${priceString}/`;
		},
		ticker() {
			if (this.protocolId == 'uniswap') {
				return Formatter.formatUniswapPool(this.investmentId);
			}
			if (this.protocolId == 'tokensets') {
				return Formatter.formatSet(this.investmentId);
			}
			return this.investmentId;
		},
		walletAddress() {
			const walletList = Storage.getWalletList();
			return walletList[this.walletId].address;
		},
	},
};
</script>
