<template>
	<div>
		<div id="list">
			<StakeCard
				v-for="stake in sortedStakes"
				:key="stake.walletId + '-' + stake.assetId + '-' + stake.poolId"
				:wallet-id="stake.walletId"
				:asset-id="stake.assetId"
				:pool-id="stake.poolId"
				:amount="stake.amount"
				:price="stake.price"
			/>
		</div>
		<div id="table">
			<StakeRow
				v-for="stake in sortedStakes"
				:key="stake.walletId + '-' + stake.assetId + '-' + stake.poolId"
				:wallet-id="stake.walletId"
				:asset-id="stake.assetId"
				:pool-id="stake.poolId"
				:amount="stake.amount"
				:price="stake.price"
			/>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import StakeCard from '../card/StakeCard.vue';
import StakeRow from '../row/StakeRow.vue';

import Converter from '../../utils/converter.js';

export default {
	components: {
		StakeCard,
		StakeRow,
	},
	props: {
		stakes: {
			type: Array,
			default: () => [],
		},
		prices: {
			type: Object,
			default: () => {},
		},
	},
	computed: {
		sortedStakes() {
			const stakes = [];
			for (const rawStake of this.stakes) {
				const { walletId, assetId, poolId, balance } = rawStake;
				const price = this.prices[assetId] || '0';
				const amount = Converter.toAmount(balance, assetId);
				const amountNumber = new BigNumber(amount);
				const value = amountNumber.times(price).toString();
				const asset = {
					walletId,
					assetId,
					poolId,
					amount,
					price,
					value,
				};
				stakes.push(asset);
			}
			stakes.sort((a, b) => {
				const aValue = new BigNumber(a.value);
				const bValue = new BigNumber(b.value);
				return aValue.lt(bValue)
					? 1
					: aValue.gt(bValue)
						? -1
						: 0;
			});
			const meaningfulStakes = stakes.filter(asset => {
				const value = new BigNumber(asset.value);
				return value.gt(1);
			});
			return meaningfulStakes;
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
