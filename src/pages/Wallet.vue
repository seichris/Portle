<template>
	<div id="view">
		<WalletList
			id="wallet-section"
			:wallets="wallets"
			:selected-wallet="walletId"
			:prices="prices"
			:components="components"
		/>
		<div id="asset-section">
			<div
				v-if="walletAssets.length > 0"
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
					:assets="walletAssets"
					:prices="prices"
				/>
			</div>
			<div
				v-if="walletDeposits.length > 0"
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
					:deposits="walletDeposits"
					:prices="prices"
					:rates="rates"
				/>
			</div>
			<div
				v-if="walletInvestments.length > 0"
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
					:investments="walletInvestments"
					:components="components"
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
import WalletList from '../components/group/WalletList.vue';

export default {
	components: {
		AssetList,
		DepositList,
		InvestmentList,
		WalletList,
	},
	data() {
		return {
			walletAddress: '',
		};
	},
	computed: {
		walletId() {
			return this.wallets.findIndex((wallet) => wallet.address == this.walletAddress);
		},
		assets() {
			const assets = Wallets.getAssets(this.wallets);
			return assets;
		},
		deposits() {
			const deposits = Wallets.getDeposits(this.wallets);
			return deposits;
		},
		investments() {
			const investments = Wallets.getInvestments(this.wallets);
			return investments;
		},
		walletAssets() {
			return this.assets.filter((asset) => asset.walletId == this.walletId);
		},
		walletDeposits() {
			return this.deposits.filter((deposit) => deposit.walletId == this.walletId);
		},
		walletInvestments() {
			return this.investments.filter((investment) => investment.walletId == this.walletId);
		},
		assetBalance() {
			const balance = Balance.getAssets(this.walletAssets, this.prices);
			return balance.toString();
		},
		depositBalance() {
			const balance = Balance.getDeposits(this.walletDeposits, this.prices);
			return balance.toString();
		},
		investmentBalance() {
			const balance = Balance.getInvestments(this.walletInvestments, this.components, this.prices);
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
		this.walletAddress = this.$route.params.wallet;
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
