<template>
	<div>
		<router-link
			id="total-value-wrapper"
			:to="'/'"
			:class="{ 'total-value-wrapper-selected': selectedWallet == -1 }"
		>
			<div id="total-value-label">
				Net worth:
			</div>
			<div id="total-value">
				{{ formatMoney(totalBalance) }}
			</div>
		</router-link>

		<div id="wallet-list">
			<div
				v-for="(wallet, walletId) in wallets"
				:key="wallet.address"
				class="wallet"
				:class="{ 'wallet-selected': walletId == selectedWallet }"
			>
				<div class="wallet-data">
					<WalletIcon
						:wallet-id="walletId"
						class="wallet-icon"
					/>
					<router-link
						class="wallet-details"
						:to="`/wallet/${wallet.address}`"
					>
						<div class="wallet-address">
							{{ formatWalletAddress(wallet.address) }}
						</div>
						<div class="wallet-value">
							{{ formatMoney(walletBalance(walletId)) }}
						</div>
					</router-link>
				</div>
				<div class="wallet-actions">
					<img
						:src="crossIcon"
						class="remove-wallet-icon"
						@click="removeWallet(wallet)"
					>
				</div>
			</div>
		</div>

		<router-link
			id="add-wallet"
			:to="'/wallet/new'"
		>
			<img
				id="add-wallet-icon"
				:src="plusIcon"
			>
			<div id="add-wallet-text">
				Add wallet
			</div>
		</router-link>
	</div>
</template>

<script>
import crossIcon from '../../../public/img/cross.svg';
import plusIcon from '../../../public/img/plus.svg';

import WalletIcon from '../icon/WalletIcon.vue';

import Balance from '../../utils/balance.js';
import Formatter from '../../utils/formatter.js';
import Storage from '../../utils/storage.js';
import Wallets from '../../utils/wallets.js';

export default {
	components: {
		WalletIcon,
	},
	props: {
		wallets: {
			type: Array,
			default: () => [],
		},
		selectedWallet: {
			type: Number,
			default: -1,
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
		assets() {
			return Wallets.getAssets(this.wallets);			
		},
		deposits() {
			return Wallets.getDeposits(this.wallets);			
		},
		investments() {
			return Wallets.getInvestments(this.wallets);			
		},
		totalBalance() {
			if (this.wallets.length == 0) {
				return '0';
			}
			const balance = Balance.getTotal(
				this.assets,
				this.deposits,
				this.investments,
				this.components,
				this.prices
			);
			return balance.toString();
		},
		crossIcon() {
			return crossIcon;
		},
		plusIcon() {
			return plusIcon;
		},
	},
	methods: {
		walletBalance(walletId) {
			const walletAssets = this.assets
				.filter(asset => asset.walletId == walletId);
			const walletDeposits = this.deposits
				.filter(deposit => deposit.walletId == walletId);
			const walletInvestments = this.investments
				.filter(investment => investment.walletId == walletId);
			const walletBalance = Balance.getTotal(
				walletAssets,
				walletDeposits,
				walletInvestments,
				this.components,
				this.prices
			);
			return walletBalance.toString();
		},
		formatMoney(moneyString) {
			return Formatter.formatMoney(moneyString);
		},
		formatWalletAddress(address) {
			return Formatter.formatAddress(address);
		},
		removeWallet(wallet) {
			const walletIndex = this.wallets.indexOf(wallet);
			Storage.removeWallet(wallet);
			this.$store.commit('removeWallet', wallet);
			if (walletIndex == this.selectedWallet) {
				this.$router.push('/');
			}
		},
	},
};
</script>

<style scoped>
#total-value-wrapper {
	display: flex;
	flex-direction: column;
	font-size: 1.125em;
	color: var(--inverted-primary-text-color);
	cursor: pointer;
}

#total-value-label {
	width: 9em;
	font-size: 0.625rem;
	color: var(--inverted-secondary-text-color);
}

.total-value-wrapper-selected > #total-value-label {
	color: var(--inverted-primary-text-color);
}

.total-value-wrapper-selected > #total-value {
	font-weight: bold;
}

#wallet-list {
	display: flex;
	margin-left: 1em;
}

.wallet {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 2.25em;
	margin-left: 0.5em;
}

.wallet-details {
	margin-left: 0.25em;
	height: 2.25em;
	cursor: pointer;
}

.wallet:hover > .wallet-actions {
	display: initial;
}

.remove-wallet-icon {
	height: 1.25em;
	width: 1.25em;
	opacity: 0.5;
	filter: invert();
}

.wallet-selected .wallet-actions > img {
	filter: invert(100%);
}

.wallet-data {
	display: flex;
	align-items: center;
}

.wallet-icon {
	height: 1em;
	width: 1em;
	opacity: 0.75;
}

.wallet-address {
	width: 9em;
	font-size: 0.625em;
	color: var(--inverted-secondary-text-color);
}

.wallet-value {
	font-size: 1.125em;
	color: var(--inverted-primary-text-color);
}

.wallet-selected .wallet-address,
.wallet-selected .wallet-value {
	color: var(--inverted-primary-text-color);
	font-weight: bold;
}

#add-wallet {
	display: flex;
	align-items: center;
	padding: 0 0.5em;
	margin-left: 1em;
	color: var(--inverted-primary-text-color);
	border: 1px solid var(--inverted-primary-text-color);
	cursor: pointer;
}

#add-wallet-icon {
	height: 0.75em;
	width: 0.75em;
	opacity: 1;
	filter: invert();
}

#add-wallet-text {
	width: 4.5em;
	margin-left: 0.25em;
	font-size: 0.75em;
}
</style>
