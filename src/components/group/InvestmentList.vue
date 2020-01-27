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
			<Row
				v-for="investment in sortedInvestments"
				:key="investment.walletId + '-' + investment.protocolId + '-' + investment.id"
				:wallet-id="investment.walletId"
				:amount="investment.amount"
				:ticker="formatInvestment(investment)"
				:title="formatProtocol(investment.protocolId)"
				:price="investment.price"
				@click.native="openInvestment(investment)"
			/>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';

import InvestmentCard from '../card/InvestmentCard.vue';
import Row from '../Row.vue';

import Converter from '../../utils/converter.js';
import Formatter from '../../utils/formatter.js';
import Storage from '../../utils/storage.js';

export default {
	components: {
		InvestmentCard,
		Row,
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
		openInvestment(investment) {
			const { walletId, protocolId, id } = investment;
			const walletList = Storage.getWalletList();
			const walletAddress = walletList[walletId].address;
			const path = `/wallet/${walletAddress}/investment/${protocolId}/${id}`;
			this.$router.push(path);
		},
		formatInvestment(investment) {
			if (investment.protocolId == 'uniswap') {
				return Formatter.formatUniswapPool(investment.id);
			}
			if (investment.protocolId == 'tokensets') {
				return Formatter.formatSet(investment.id);
			}
			return investment.id;
		},
		formatProtocol(protocolId) {
			return Formatter.formatProtocol(protocolId);
		},
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
