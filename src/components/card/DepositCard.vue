<template>
	<router-link
		id="card"
		:to="`/wallet/${walletAddress}/deposit/${protocolId}/${assetId}`"
	>
		<Card
			:wallet-id="walletId"
			:amount="amount"
			:ticker="ticker"
			:title="title"
			:subtitle="rate"
			:price="price"
		/>
		<AssetIcon
			id="logo"
			:asset-id="assetId"
		/>
	</router-link>
</template>

<script>
import AssetIcon from '../icon/AssetIcon.vue';
import Card from './Card.vue';

import Formatter from '../../utils/formatter.js';
import Storage from '../../utils/storage.js';

export default {
	components: {
		AssetIcon,
		Card,
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
		ticker() {
			return Formatter.formatAsset(this.assetId);	
		},
		title() {
			return Formatter.formatProtocol(this.protocolId);
		},
		walletAddress() {
			const walletList = Storage.getWalletList();
			return walletList[this.walletId].address;
		},
	},
};
</script>

<style scoped>
#card {
	display: flex;
	justify-content: center;
	align-items: center;
}

#logo {
	width: 64px;
	height: 64px;
	position: absolute;
	pointer-events: none;
	opacity: 0.1;
}
</style>
