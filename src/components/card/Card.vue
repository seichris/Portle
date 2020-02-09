<template>
	<div class="card">
		<div class="sparse">
			<div class="amount">
				{{ formatAmount(amount) }} {{ ticker }}
			</div>
			<WalletIcon
				:wallet-id="walletId"
				class="wallet-icon"
			/>
		</div>
		<div class="detail-section sparse">
			<div>{{ title }}</div>
			<div v-if="subtitle">
				{{ formatRate(subtitle) }}
			</div>
		</div>
		<div class="price-section sparse">
			<div>{{ formatMoney(price) }}/</div>
			<div>{{ formatMoney(value) }}</div>
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
		subtitle: {
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
.card {
	box-sizing: border-box;
	width: 11.25em;
	height: 5em;
	margin: 0.5em;
	padding: 0.5em 1em;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
	transition: transform 0.3s, box-shadow 0.3s, -webkit-transform 0.3s;
	transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1);
	cursor: pointer;
}

.card:hover {
	box-shadow: 0 12px 36px rgba(0, 0, 0, 0.2);
}

.amount {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	width: calc(100% - 0.75em);
	font-size: 1.125em;
	color: var(--primary-text-color);
}

.wallet-icon {
	height: 0.75em;
	width: 0.75em;
	opacity: 0.25;
}

.detail-section {
	margin-top: 0.25em;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.detail-section,
.price-section {
	font-size: 0.875em;
	color: var(--secondary-text-color);
}

.sparse {
	display: flex;
	justify-content: space-between;
	align-items: center;
}
</style>
