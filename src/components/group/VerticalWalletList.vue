<template>
	<div>
		<div id="total-value">
			Net worth: {{ formatMoney(totalBalance) }}
		</div>

		<div id="wallet-list">
			<div id="wallet-list-header">
				Wallets
			</div>
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
						:src="clipboardIcon"
						class="copy-address-icon"
						@click="copyWalletAddress(wallet.address)"
					>
					<img
						:src="crossIcon"
						class="remove-wallet-icon"
						@click="removeWallet(wallet)"
					>
				</div>
			</div>
			<router-link
				id="add-wallet"
				:to="'/wallet/new'"
			>
				<div id="add-wallet-icon">
					<img :src="plusIcon">
				</div>
				<div id="add-wallet-text">
					<div id="add-wallet-title">
						Add new wallet
					</div>
					<div id="add-wallet-subtitle">
						Metamask, ENS, address, etc
					</div>
				</div>
			</router-link>
		</div>
		<button @click="exportAssets()">
			Export
		</button>
	</div>
</template>

<script>
import clipboardIcon from '../../../public/img/clipboard.svg';
import crossIcon from '../../../public/img/cross.svg';
import plusIcon from '../../../public/img/plus.svg';

import WalletIcon from '../icon/WalletIcon.vue';

import Balance from '../../utils/balance.js';
import Exporter from '../../utils/exporter.js';
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
		stakes() {
			return Wallets.getStakes(this.wallets);			
		},
		totalBalance() {
			if (this.wallets.length == 0) {
				return '0';
			}
			const balance = Balance.getTotal(
				this.assets,
				this.deposits,
				this.investments,
				this.stakes,
				this.components,
				this.prices
			);
			return balance.toString();
		},
		clipboardIcon() {
			return clipboardIcon;
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
			const walletStakes = this.stakes
				.filter(stake => stake.walletId == walletId);
			const walletBalance = Balance.getTotal(
				walletAssets,
				walletDeposits,
				walletInvestments,
				walletStakes,
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
		copyWalletAddress(address) {
			navigator.clipboard.writeText(address);
		},
		removeWallet(wallet) {
			const walletIndex = this.wallets.indexOf(wallet);
			Storage.removeWallet(wallet);
			this.$store.commit('removeWallet', wallet);
			if (walletIndex == this.selectedWallet) {
				this.$router.push('/');
			}
		},
		exportAssets() {
			const data = Exporter.toCsv(this.wallets, this.prices);
			this._saveFile(data, 'assets.csv', 'type : \'text/csv\'');
		},
		_saveFile(data, name, type) {
			const file = new Blob([ data ], { type });
			const a = document.createElement('a');
			const url = URL.createObjectURL(file);
			a.href = url;
			a.download = name;
			document.body.appendChild(a);
			a.click();
			setTimeout(function() {
				document.body.removeChild(a);
				window.URL.revokeObjectURL(url);  
			}, 0); 
		}
	},
};
</script>

<style scoped>
#total-value {
	display: flex;
	font-size: 1.125em;
	font-weight: bold;
}

#wallet-list {
	margin-top: 2.25em;
}

#wallet-list-header {
	margin-bottom: 1.125em;
	font-size: 1.125em;
	font-weight: bold;
}

.wallet,
#add-wallet {
	padding: 1.25em 0.5em;
	border-top: 1px solid var(--outline-color);
	display: flex;
	align-items: center;
}

.wallet {
	justify-content: space-between;
}

.wallet-selected {
	background: var(--brand-color);
	margin: 0 -1em;
	padding: 1.25em 1.5em;
}

.wallet-details {
	cursor: pointer;
}

.wallet-actions {
	display: none;
}

.wallet:hover > .wallet-actions {
	display: initial;
}

.copy-address-icon,
.remove-wallet-icon {
	margin-left: 0.5em;
	height: 1.25em;
	width: 1.25em;
	opacity: 0.25;
}

.copy-address-icon:hover,
.remove-wallet-icon:hover {
	opacity: 0.5;
}

.wallet-selected .wallet-actions > img {
	filter: invert(100%);
}

#add-wallet {
	cursor: pointer;
}

#add-wallet-icon {
	display: flex;
	height: 2em;
	width: 2em;
	align-items: center;
	justify-content: center;
	border-radius: 1em;
	background: var(--cover-color);
}

.wallet-data {
	display: flex;
	align-items: center;
}

.wallet-icon {
	height: 2em;
	width: 2em;
	opacity: 0.75;
}

.wallet-details,
#add-wallet-text {
	margin-left: 0.75em;
}

.wallet-address {
	font-size: 0.875em;
	color: var(--secondary-text-color);
}

.wallet-value {
	font-size: 1.125em;
	font-weight: bold;
	color: var(--primary-text-color);
}

.wallet-selected .wallet-address,
.wallet-selected .wallet-value {
	color: var(--inverted-primary-text-color);
}

#add-wallet-icon > img {
	height: 1em;
	width: 1em;
	opacity: 0.5;
}

#add-wallet-title {
	color: var(--primary-text-color);
}

#add-wallet-subtitle {
	font-size: 0.875em;
	color: var(--secondary-text-color);
}
</style>
