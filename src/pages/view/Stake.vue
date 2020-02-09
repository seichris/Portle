<template>
	<div id="view">
		<WalletList
			id="wallet-section"
			:wallets="wallets"
			:selected-wallet="walletId"
			:prices="prices"
			:components="components"
		/>
		<div id="stake-section">
			<div
				v-if="stake"
				id="stake-icon"
			>
				<AssetIcon :asset-id="stake.assetId" />
			</div>
			<div
				v-if="stake"
				id="stake-view"
			>
				<div id="amount">
					{{ formatAmount(stake.amount) }} {{ formatTicker(stake.assetId) }}
				</div>
				<div id="pool-details">
					<div>
						{{ formatPool(stake.assetId, stake.poolId) }}
					</div>
				</div>
				<div id="asset-details">
					<div>
						{{ stake.assetName }}
					</div>
					<div id="price">
						{{ formatMoney(stake.price) }}/
					</div>
					<div>
						{{ formatMoney(stake.value) }}
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
			poolId: '',
			assetId: '',
		};
	},
	computed: {
		stake() {
			if (this.balance == 0) {
				return;
			}
			const assetName = tokens[this.assetId];
			const assetId = this.assetId;
			const poolId = this.poolId;
			const price = this.prices[assetId];
			const balance = this.balance;
			if (!price) {
				return;
			}
			const amount = Converter.toAmount(balance, assetId);
			const amountNumber = new BigNumber(amount);
			const value = amountNumber.times(price).toString();
			const stake = {
				poolId,
				assetId,
				assetName,
				amount,
				price,
				value,
			};
			return stake;
		},
		balance() {
			const wallet = this.wallets[this.walletId];
			if (!wallet || !wallet.stakes) {
				return 0;
			}
			const balance = wallet.stakes[this.assetId][this.poolId];
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
		this.poolId = this.$route.params.poolId;
		this.assetId = this.$route.params.assetId;
		this._load(walletList);
	},
	methods: {
		formatTicker(assetId) {
			return Formatter.formatTicker(assetId);
		},
		formatPool(assetId, poolId) {
			return Formatter.formatPool(assetId, poolId);
		},
		formatAmount(amountString) {
			return Formatter.formatAmount(amountString);
		},
		formatMoney(priceString) {
			return Formatter.formatMoney(priceString);
		},
		formatRate(rateString) {
			return Formatter.formatRate(rateString);
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

#stake-section {
	flex: 3;
	padding: 4.75em 3.5em 0 3.5em;
	display: flex;
	justify-content: center;
}

#stake-icon {
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

#stake-icon > img {
	width: 3em;
	height: 3em;
}

#stake-view {
	padding: 2.75em 3em 0 3em;
	box-sizing: border-box;
	width: 40em;
	height: 14.75em;
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

#pool-details,
#asset-details {
	display: flex;
	font-size: 1.5em;
}

#pool-details {
	margin-top: 1.25rem;
	justify-content: center;
}

#asset-details {
	margin-top: 0.875rem;
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
	#stake-section {
		padding: 4em 0 1em 0;
	}

	#stake-view {
		height: initial;
		padding: 3em 1.5em 1em 1.5em;
		width: 90%;
	}

	#protocol-details > div {
		font-size: 1.125rem;
		text-align: center;
	}

	#asset-details > div {
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
