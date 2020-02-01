<template>
	<div>
		<div id="list">
			<DepositCard
				v-for="deposit in sortedDeposits"
				:key="deposit.walletId + '-' + deposit.protocolId + '-' + deposit.assetId"
				:amount="deposit.amount"
				:asset-id="deposit.assetId"
				:wallet-id="deposit.walletId"
				:protocol-id="deposit.protocolId"
				:rate="deposit.rate"
				:price="deposit.price"
			/>
		</div>
		<div id="table">
			<DepositRow
				v-for="deposit in sortedDeposits"
				:key="deposit.walletId + '-' + deposit.protocolId + '-' + deposit.assetId"
				:wallet-id="deposit.walletId"
				:amount="deposit.amount"
				:asset-id="deposit.assetId"
				:protocol-id="deposit.protocolId"
				:price="deposit.price"
				:rate="deposit.rate"
			/>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import DepositCard from '../card/DepositCard.vue';
import DepositRow from '../row/DepositRow.vue';

import Converter from '../../utils/converter.js';

export default {
	components: {
		DepositCard,
		DepositRow,
	},
	props: {
		deposits: {
			type: Array,
			default: () => [],
		},
		rates: {
			type: Object,
			default: () => {},
		},
		prices: {
			type: Object,
			default: () => {},
		},
	},
	computed: {
		sortedDeposits() {
			const deposits = [];
			for (const rawDeposit of this.deposits) {
				const { walletId, assetId, protocolId, balance } = rawDeposit;
				const price = this.prices[assetId] || '0';
				const rate = this.rates.supply[protocolId][assetId];
				const amount = Converter.toAmount(balance, assetId);
				const amountNumber = new BigNumber(amount);
				const value = amountNumber.times(price).toString();
				const deposit = {
					walletId,
					amount,
					assetId,
					protocolId,
					price,
					rate,
					value,
				};
				deposits.push(deposit);
			}
			deposits.sort((a, b) => {
				const aValue = new BigNumber(a.value);
				const bValue = new BigNumber(b.value);
				return aValue.lt(bValue)
					? 1
					: aValue.gt(bValue)
						? -1
						: 0;
			});
			const meaningfulDeposits = deposits.filter(deposit => {
				const value = new BigNumber(deposit.value);
				return value.gt(1);
			});
			return meaningfulDeposits;
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
