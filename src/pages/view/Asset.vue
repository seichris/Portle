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
				v-if="asset"
				id="asset-icon"
			>
				<AssetIcon :asset-id="asset.id" />
			</div>
			<div
				v-if="asset"
				id="asset-view"
			>
				<div id="amount">
					{{ formatAmount(asset.amount) }} {{ formatTicker(asset.id) }}
				</div>
				<div id="details">
					<div id="name">
						{{ asset.name }}
					</div>
					<div id="price">
						{{ formatMoney(asset.price) }}/
					</div>
					<div id="value">
						{{ formatMoney(asset.value) }}
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import BigNumber from 'bignumber.js';
import { mapState } from 'vuex';

import Converter from '../../utils/converter.js';
import Formatter from '../../utils/formatter.js';
import Loader from '../../utils/loader.js';
import Storage from '../../utils/storage.js';

import tokens from '../../data/tokens.json';

import AssetIcon from '../../components/icon/AssetIcon.vue';
import WalletList from '../../components/group/WalletList.vue';

export default {
	components: {
		AssetIcon,
		WalletList,
	},
	data() {
		return {
			address: '',
			assetId: '',
		};
	},
	computed: {
		asset() {
			if (!this.assetId) {
				return;
			}
			const id = this.assetId;
			const name = tokens[id];
			const balance = this.balance;
			const price = this.prices[id];
			const amount = Converter.toAmount(balance, id);
			const amountNumber = new BigNumber(amount);
			const value = amountNumber.times(price).toString();
			const asset = {
				name,
				id,
				amount,
				price,
				value,
			};
			return asset;
		},
		balance() {
			const wallet = this.wallets[this.walletId];
			if (!wallet || !wallet.assets) {
				return 0;
			}
			const balance = wallet.assets[this.assetId];
			if (!balance) {
				return 0;
			}
			return balance;
		},
		walletId() {
			return this.wallets.findIndex(wallet => wallet.address == this.address);
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
		this.address = this.$route.params.wallet;
		this.assetId = this.$route.params.assetId;
		this._load(walletList);
	},
	methods: {
		formatTicker(assetId) {
			return Formatter.formatTicker(assetId);
		},
		formatAmount(amountString) {
			return Formatter.formatAmount(amountString);
		},
		formatMoney(priceString) {
			return Formatter.formatMoney(priceString);
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
	padding: 4.75em 3.5em 0 3.5em;
	display: flex;
	justify-content: center;
}

#asset-icon {
	display: flex;
	position: absolute;
	width: 4em;
	height: 4em;
	margin-top: -2em;
	align-items: center;
	justify-content: center;
	background: var(--cover-color);
	border-radius: 2em;
}

#asset-icon > img {
	width: 3em;
	height: 3em;
}

#asset-view {
	padding: 2.75em 3em 2.5em 3em;
	box-sizing: border-box;
	width: 40em;
	height: 13.5em;
	background: var(--brand-color);
	border-radius: 8px;
	color: var(--inverted-secondary-text-color);
}

#amount {
	font-size: 4em;
	text-align: center;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	color: var(--inverted-primary-text-color);
}

#details {
	display: flex;
	margin-top: 1.25rem;
	font-size: 1.5em;
	justify-content: space-between;
}

@media all and (max-width: 1024px) {
	#view {
		display: block;
	}

	#wallet-section {
		padding: 0;
	}
}

@media all and (max-width: 767px) {
	#asset-section {
		padding: 4em 0 1em 0;
	}

	#asset-view {
		height: initial;
		padding: 3em 1.5em 1em 1.5em;
		width: 90%;
	}

	#details > div {
		font-size: 1.125rem;
	}

	#amount {
		font-size: 1.5em;
	}

	#price {
		display: none;
	}
}
</style>
