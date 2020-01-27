<template>
	<div>
		<div id="list">
			<InvestmentCard
				v-for="investment in sortedInvestments"
				:key="investment.walletId + '-' + investment.protocolId + '-' + investment.id"
				:amount="investment.amount"
				:investment-id="investment.id"
				:wallet-id="investment.walletId"
				:protocol-id="investment.protocolId"
				:price="investment.price"
			/>
		</div>
		<div id="table">
			<InvestmentRow
				v-for="investment in sortedInvestments"
				:key="investment.walletId + '-' + investment.protocolId + '-' + investment.id"
				:wallet-id="investment.walletId"
				:amount="investment.amount"
				:investment-id="investment.id"
				:protocol-id="investment.protocolId"
				:price="investment.price"
			/>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import InvestmentCard from '../card/InvestmentCard.vue';
import InvestmentRow from '../row/InvestmentRow.vue';

import Converter from '../../utils/converter.js';

export default {
	components: {
		InvestmentCard,
		InvestmentRow,
	},
	props: {
		investments: {
			type: Array,
			default: () => [],
		},
		components: {
			type: Object,
			default: () => {},
		},
		prices: {
			type: Object,
			default: () => {},
		},
	},
	computed: {
		sortedInvestments() {
			const investments = [];
			for (const rawInvestment of this.investments) {
				const { walletId, protocolId, id, balance } = rawInvestment;
				const components = this.components[protocolId][id];
				const price = this._getPrice(components);
				if (!price) {
					continue;
				}
				const amount = Converter.toAmount(balance, 'eth');
				const amountNumber = new BigNumber(amount);
				const value = amountNumber.times(price).toString();
				const investment = {
					walletId,
					id,
					protocolId,
					amount,
					price,
					value,
				};
				investments.push(investment);
			}
			investments.sort((a, b) => {
				const aValue = new BigNumber(a.value);
				const bValue = new BigNumber(b.value);
				return aValue.lt(bValue)
					? 1
					: aValue.gt(bValue)
						? -1
						: 0;
			});
			const meaningfulInvestments = investments.filter(investment => {
				const value = new BigNumber(investment.value);
				return value.gt(1);
			});
			return meaningfulInvestments;
		},
	},
	methods: {
		_getPrice(components) {
			let price = new BigNumber(0);
			for (const component of components) {
				const amountNumber = new BigNumber(component.amount);
				const assetId = component.assetId;
				const assetPrice = this.prices[assetId];
				if (!assetPrice) {
					return;
				}
				const componentPrice = amountNumber.times(assetPrice);
				price = price.plus(componentPrice);
			}
			return price.toNumber();
		}
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
