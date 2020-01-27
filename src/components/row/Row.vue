<template>
	<div class="row">
		<div class="wallet-icon-wrapper">
			<WalletIcon
				:wallet-id="walletId"
				class="wallet-icon"
			/>
		</div>
		<div class="details">
			<div class="title sparse">
				<div>{{ title }}</div>
				<div>{{ formatMoney(price) }}/</div>
			</div>
			<div class="amount sparse">
				<div>{{ formatAmount(amount) }} {{ ticker }}</div>
				<div>{{ formatMoney(value) }}</div>
			</div>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import WalletIcon from '../icon/WalletIcon.vue';

import Formatter from '../../utils/formatter.js';

export default {
	components: {
		WalletIcon,
	},
	props: {
		walletId: {
			type: Number,
			default: 0,
		},
		amount: {
			type: String,
			default: '0',
		},
		ticker: {
			type: String,
			default: '',
		},
		title: {
			type: String,
			default: '',
		},
		price: {
			type: Number,
			default: 0,
		},
	},
	computed: {
		value() {
			const amountNumber = new BigNumber(this.amount);
			const valueNumber = amountNumber.times(this.price);
			return valueNumber;
		},
	},
	methods: {
		formatAmount(amountString) {
			return Formatter.formatAmount(amountString);
		},
		formatRate(rateString) {
			return Formatter.formatRate(rateString);
		},
		formatMoney(priceString) {
			return Formatter.formatMoney(priceString);
		},
	}
};
</script>

<style scoped>
.row {
	display: flex;
	margin: 0 0 0.5em -1.5em;
	padding: 0;
	background: var(--background-color);
	cursor: pointer;
}

.row:last-child {
	border: none;
}

.wallet-icon-wrapper {
	display: flex;
	margin: 0.5em;
	align-items: center;
}

.wallet-icon {
	height: 0.5em;
	width: 0.5em;
	opacity: 0.25;
}

.details {
	flex: 1;
}

.amount {
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	color: var(--primary-text-color);
}

.title {
	font-size: 0.75em;
	margin-top: 0.25em;
	color: var(--secondary-text-color);
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.sparse {
	display: flex;
	justify-content: space-between;
}
</style>
