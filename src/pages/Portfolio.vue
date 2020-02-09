<template>
	<div id="view">
		<WalletList
			id="wallet-section"
			:wallets="wallets"
			:prices="prices"
			:components="components"
		/>
		<div id="asset-section">
			<div
				v-if="assets.length > 0"
				class="category"
			>
				<div class="category-header">
					<h2 class="category-title">
						Assets
					</h2>
					<div class="category-value">
						{{ formatMoney(assetBalance) }}
					</div>
				</div>
				<AssetList
					:assets="assets"
					:prices="prices"
				/>
			</div>
			<div
				v-if="deposits.length > 0"
				class="category"
			>
				<div class="category-header">
					<h2 class="category-title">
						Deposits
					</h2>
					<div class="category-value">
						{{ formatMoney(depositBalance) }}
					</div>
				</div>
				<DepositList
					:deposits="deposits"
					:prices="prices"
					:rates="rates"
				/>
			</div>
			<div
				v-if="investments.length > 0"
				class="category"
			>
				<div class="category-header">
					<h2 class="category-title">
						Investments
					</h2>
					<div class="category-value">
						{{ formatMoney(investmentBalance) }}
					</div>
				</div>
				<InvestmentList
					:investments="investments"
					:components="components"
					:prices="prices"
				/>
			</div>
			<div
				v-if="stakes.length > 0"
				class="category"
			>
				<div class="category-header">
					<h2 class="category-title">
						Stakes
					</h2>
					<div class="category-value">
						{{ formatMoney(stakeBalance) }}
					</div>
				</div>
				<StakeList
					:stakes="stakes"
					:prices="prices"
				/>
			</div>
		</div>
	</div>
</template>

<script>
import { mapState } from 'vuex';

import Balance from '../utils/balance.js';
import Formatter from '../utils/formatter.js';
import Loader from '../utils/loader.js';
import Storage from '../utils/storage.js';
import Wallets from '../utils/wallets.js';

import AssetList from '../components/group/AssetList.vue';
import DepositList from '../components/group/DepositList.vue';
import InvestmentList from '../components/group/InvestmentList.vue';
import StakeList from '../components/group/StakeList.vue';
import WalletList from '../components/group/WalletList.vue';

export default {
	components: {
		AssetList,
		DepositList,
		InvestmentList,
		StakeList,
		WalletList,
	},
	computed: {
		assets() {
			return Wallets.getAssets(this.wallets);
		},
		deposits() {
			return Wallets.getDeposits(this.wallets);
		},
		investments() {
			return Wallets.getInvestments(this.wallets);
		},
		stakes() {
			return Wallets.getStakes(this.wallets);
		},
		assetBalance() {
			const balance = Balance.getAssets(this.assets, this.prices);
			return balance.toString();
		},
		depositBalance() {
			const balance = Balance.getDeposits(this.deposits, this.prices);
			return balance.toString();
		},
		investmentBalance() {
			const balance = Balance.getInvestments(this.investments, this.components, this.prices);
			return balance.toString();
		},
		stakeBalance() {
			const balance = Balance.getStakes(this.stakes, this.prices);
			return balance.toString();
		},
		...mapState([
			'wallets',
			'prices',
			'rates',
			'components',
		]),
	},
	async mounted() {
		const walletList = Storage.getWalletList();
		if (walletList.length == 0) {
			this.$router.push('/login');
			return;
		}
		this._load(walletList);
	},
	methods: {
		formatMoney(moneyString) {
			return Formatter.formatMoney(moneyString);
		},
		async _load(walletList) {
			const addresses = walletList.map(wallet => wallet.address);
			const savedWallets = this.$store.state.wallets;
			if (addresses.length == savedWallets.length) {
				return;
			}
			const requiredWallets = [];
			for (const address of addresses) {
				const wallet = savedWallets.find(wallet => wallet.address == address);
				if (wallet) {
					requiredWallets.push(wallet);
				} else {
					requiredWallets.push({ address });
				}
			}
			this.$store.commit('setWallets', requiredWallets);
			const {wallets, prices, rates, components} = await Loader.loadWallets(addresses);
			this.$store.commit('setWallets', wallets);
			this.$store.commit('setPrices', prices);
			this.$store.commit('setRates', rates);
			this.$store.commit('setComponents', components);
		},
	},
};
</script>

<style scoped>
#view {
	display: flex;
}

#wallet-section {
	flex: 1;
	padding: 1.5em 1em;
}

#asset-section {
	flex: 3;
	padding: 3.25em 3.5em 0 3.5em;
}

#total {
	display: flex;
	justify-content: center;
}

.category {
	margin-bottom: 2em;
	padding: 0 2em 1em 2em;
	border: 1px solid var(--outline-color);
	border-radius: 8px;
}

.category-header {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
}

.category-title {
	font-size: 1.5em;
	font-weight: bold;
}

.category-value {
	font-size: 1.25em;
	font-weight: bold;
}

.icon {
	width: 24px;
	margin: 1.25em 0 0 1em;
	opacity: 0.5;
}

.icon:hover {
	opacity: 1;
}

#swap-button {
	margin-left: 8px;
}

#advanced-buttons {
	margin-top: 1em;
}

@media all and (max-width: 1024px) {
	#view {
		display: block;
	}

	#wallet-section {
		padding: 0;
	}
}

@media all and (max-width: 768px) {
	#asset-section {
		flex: 0;
		padding: 0;
	}

	.category {
		margin-bottom: 1em;
		padding: 0 2em;
		border: none;
	}
}
</style>
