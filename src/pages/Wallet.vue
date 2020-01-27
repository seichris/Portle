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
		</div>
	</div>
</template>

<script>
import Vue from 'vue';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import Balance from '../utils/balance.js';
import Converter from '../utils/converter.js';
import Formatter from '../utils/formatter.js';
import Loader from '../utils/loader.js';
import Storage from '../utils/storage.js';
import Wallets from '../utils/wallets.js';

import tokenAddresses from '../data/addresses.json';

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
			wallets: [],
			components: {
				uniswap: {},
				tokensets: {},
				melon: {},
			},
			prices: {},
			rates: {
				supply: {
					compound: {},
					dydx: {},
					fulcrum: {},
					maker: {},
				},
				borrow: {
					compound: {},
					dydx: {},
					fulcrum: {},
					maker: {},
				},
			},
		};
	},
	computed: {
		walletId() {
			return this.wallets.findIndex((wallet) => wallet.address == this.walletAddress);
		},
		assets() {
			const assets = Wallets.getAssets(this.wallets);
			return assets.filter((asset) => asset.walletId == this.walletId);
		},
		deposits() {
			const deposits = Wallets.getDeposits(this.wallets);
			return deposits.filter((deposit) => deposit.walletId == this.walletId);
		},
		investments() {
			const investments = Wallets.getInvestments(this.wallets);
			return investments.filter((investment) => investment.walletId == this.walletId);
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
	},
	async mounted() {
		const walletList = Storage.getWalletList();
		if (walletList.length == 0) {
			this.$router.push('/login');
			return;
		}
		this.walletAddress = this.$route.params.wallet;
		this._initWallets(walletList);
		await this._loadBalances();
		this._loadPrices();
	},
	methods: {
		formatMoney(moneyString) {
			return Formatter.formatMoney(moneyString);
		},
		_initWallets(walletList) {
			this.wallets = [];
			for (const wallet of walletList) {
				const address = wallet.address;
				const emptyWallet = {
					address,
					assets: {},
					deposits: {
						compound: {},
						dydx: {},
						fulcrum: {},
						maker: {},
					},
					investments: {
						uniswap: {},
						tokensets: {},
						melon: {},
					},
				};
				this.wallets.push(emptyWallet);
			}
		},
		async _loadBalances() {
			const balancePromises = [
				this._loadAssets(),
				this._loadCompound(),
				this._loadDydx(),
				this._loadFulcrum(),
				this._loadMaker(),
				this._loadUniswap(),
				this._loadTokenSets(),
				this._loadMelon(),
			];
			await Promise.all(balancePromises);
		},
		async _loadPrices() {
			const assetSet = {};
			const assets = Wallets.getAssets(this.wallets);
			const deposits = Wallets.getDeposits(this.wallets);
			const investments = Wallets.getInvestments(this.wallets);
			for (const asset of assets) {
				const { id } = asset;
				assetSet[id] = true;
			}
			for (const deposit of deposits) {
				const { assetId } = deposit;
				assetSet[assetId] = true;
			}
			for (const investment of investments) {
				const { protocolId, id } = investment;
				const components = this.components[protocolId][id];
				for (const component of components) {
					const { assetId } = component;
					assetSet[assetId] = true;
				}
			}
			const assetIds = Object.keys(assetSet);
			const prices = await Loader.loadPrices(assetIds);
			for (let i = 0; i < assetIds.length; i++) {
				const assetId = assetIds[i];
				const price = prices[assetId];
				Vue.set(this.prices, assetId, price);
			}
		},
		async _loadAssets() {
			const walletCount = this.wallets.length;
			const addresses = this.wallets.map(wallet => wallet.address);
			const walletBalances = await Loader.loadAssets(addresses);
			for (let i = 0; i < walletCount; i++) {
				const address = addresses[i];
				const balances = walletBalances[address];
				const wallet = this.wallets[i];
				for (const assetId in balances) {
					const balance = balances[assetId];
					Vue.set(wallet.assets, assetId, balance);
				}
			}
		},
		async _loadCompound() {
			const walletCount = this.wallets.length;
			const addresses = this.wallets.map(wallet => wallet.address);
			const data = await Loader.loadCompound(addresses);
			for (let i = 0; i < walletCount; i++) {
				const address = addresses[i];
				const walletBalance = data[`user_${address}`];
				if (!walletBalance) {
					continue;
				}
				const balances = walletBalance.balances;
				const wallet = this.wallets[i];
				for (const balance of balances) {
					const addressMap = Converter.reverseMap(tokenAddresses);
					const assetAddress = ethers.utils.getAddress(balance.token.underlying.address);
					const assetId = addressMap[assetAddress];
					const supplyIndex = balance.token.supplyIndex;
					const tokenRawBalance = balance.balance;
					// Set balances
					const tokenRawBalanceNumber = new BigNumber(tokenRawBalance);
					const tokenBalanceNumber = tokenRawBalanceNumber.times(supplyIndex).div('1e18');
					const tokenBalance = tokenBalanceNumber.toString();
					Vue.set(wallet.deposits.compound, assetId, tokenBalance);
					// Set rates
					const supplyRawRate = balance.token.supplyRate;
					const borrowRawRate = balance.token.borrowRate;
					const supplyRawRateNumber = new BigNumber(supplyRawRate);
					const borrowRawRateNumber = new BigNumber(borrowRawRate);
					const supplyRateNumber = supplyRawRateNumber.times('2102400').div('1e18');
					const borrowRateNumber = borrowRawRateNumber.times('2102400').div('1e18');
					const supplyRate = supplyRateNumber.toString();
					const borrowRate = borrowRateNumber.toString();
					Vue.set(this.rates.supply.compound, assetId, supplyRate);
					Vue.set(this.rates.borrow.compound, assetId, borrowRate);
				}
			}
		},
		async _loadDydx() {
			const walletCount = this.wallets.length;
			const addresses = this.wallets.map(wallet => wallet.address);
			const data = await Loader.loadDydx(addresses);

			const markets = data.markets;
			for (const market of markets) {
				const addressMap = Converter.reverseMap(tokenAddresses);
				const assetAddress = ethers.utils.getAddress(market.token.address);
				const assetId = addressMap[assetAddress];

				const supplyRawRate = market.supplyRate;
				const supplyRawRateNumber = new BigNumber(supplyRawRate);
				const supplyRateNumber = supplyRawRateNumber.div('1e18');
				const supplyRate = supplyRateNumber.toString();
				Vue.set(this.rates.supply.dydx, assetId, supplyRate);
			}

			for (let i = 0; i < walletCount; i++) {
				const address = addresses[i];
				const walletBalance = data[`user_${address}`];
				if (!walletBalance) {
					continue;
				}
				const balances = walletBalance.balances;
				const wallet = this.wallets[i];

				const marketBalances = balances.reduce((map, balance) => {
					const addressMap = Converter.reverseMap(tokenAddresses);
					const assetAddress = ethers.utils.getAddress(balance.market.token.address);
					const assetId = addressMap[assetAddress];

					const index = balance.market.supplyIndex;
					const accountRawBalance = balance.balance;
					const accountRawBalanceNumber = new BigNumber(accountRawBalance);
					const accountBalanceNumber = accountRawBalanceNumber.times(index).div('1e18');
					if (accountBalanceNumber.isNegative()) {
						return map;
					}

					const prevMarketBalance = map[assetId] || '0';
					const marketBalanceNumber = accountBalanceNumber.plus(prevMarketBalance);
					const marketBalance = marketBalanceNumber.toString();
					map[assetId] = marketBalance;
					return map;
				}, {});
				for (const assetId in marketBalances) {
					const marketBalance = marketBalances[assetId];
					Vue.set(wallet.deposits.dydx, assetId, marketBalance);
				}
			}
		},
		async _loadFulcrum() {
			const walletCount = this.wallets.length;
			const addresses = this.wallets.map(wallet => wallet.address);
			const data = await Loader.loadFulcrum(addresses);
			for (let i = 0; i < walletCount; i++) {
				const address = addresses[i];
				const walletBalance = data[`user_${address}`];
				if (!walletBalance) {
					continue;
				}
				const balances = walletBalance.balances;
				const wallet = this.wallets[i];
				for (const balance of balances) {
					const addressMap = Converter.reverseMap(tokenAddresses);
					const assetAddress = ethers.utils.getAddress(balance.token.underlying.address);
					const assetId = addressMap[assetAddress];
					const index = balance.token.supplyIndex;
					const tokenRawBalance = balance.balance;
					// Set balances
					const tokenRawBalanceNumber = new BigNumber(tokenRawBalance);
					const tokenBalanceNumber = tokenRawBalanceNumber.times(index).div('1e18');
					const tokenBalance = tokenBalanceNumber.toString();
					Vue.set(wallet.deposits.fulcrum, assetId, tokenBalance);
					// Set rates
					const supplyRawRate = balance.token.supplyRate;
					const borrowRawRate = balance.token.borrowRate;
					const supplyRawRateNumber = new BigNumber(supplyRawRate);
					const borrowRawRateNumber = new BigNumber(borrowRawRate);
					const supplyRateNumber = supplyRawRateNumber.div('1e18').div('1e2');
					const borrowRateNumber = borrowRawRateNumber.div('1e18').div('1e2');
					const supplyRate = supplyRateNumber.toString();
					const borrowRate = borrowRateNumber.toString();
					Vue.set(this.rates.supply.fulcrum, assetId, supplyRate);
					Vue.set(this.rates.borrow.fulcrum, assetId, borrowRate);
				}
			}
		},
		async _loadMaker() {
			const walletCount = this.wallets.length;
			const addresses = this.wallets.map(wallet => wallet.address);
			const data = await Loader.loadMaker(addresses);

			const maker = data.maker;
			const index = maker.index;
			const rawRate = maker.rate;
			const rawRateNumber = new BigNumber(rawRate);
			const rateNumber = rawRateNumber.div('1e27').minus(1).times(60 * 60 * 24 * 365);
			const rate = rateNumber.toString();
			Vue.set(this.rates.supply.maker, 'dai', rate);

			for (let i = 0; i < walletCount; i++) {
				const address = addresses[i];
				const user = data[`user_${address}`];
				if (!user) {
					continue;
				}
				const wallet = this.wallets[i];
				const rawBalance = user.balance;
				const rawChaiBalance = user.chaiBalance;
				const rawProxyBalance = user.proxy
					? user.proxy.balance
					: 0;
				const rawBalanceNumber = new BigNumber(rawBalance);
				const rawChaiBalanceNumber = new BigNumber(rawChaiBalance);
				const rawProxyBalanceNumber = new BigNumber(rawProxyBalance);
				const rawTotalBalanceNumber = rawBalanceNumber
					.plus(rawChaiBalanceNumber)
					.plus(rawProxyBalanceNumber);
				const totalBalanceNumber = rawTotalBalanceNumber.times(index).div('1e27');
				const totalBalance = totalBalanceNumber.toString();
				Vue.set(wallet.deposits.maker, 'dai', totalBalance);
			}
		},
		async _loadUniswap() {
			const walletCount = this.wallets.length;
			const addresses = this.wallets.map(wallet => wallet.address);
			const data = await Loader.loadUniswap(addresses);
			for (let i = 0; i < walletCount; i++) {
				const address = addresses[i];
				const walletBalance = data[`user_${address}`];
				if (!walletBalance) {
					continue;
				}
				const pools = walletBalance.exchangeBalances;
				const wallet = this.wallets[i];
				for (const pool of pools) {
					const addressMap = Converter.reverseMap(tokenAddresses);
					const tokenAddress = pool.exchange.tokenAddress;
					const address = tokenAddress == '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f'
						? '0xc011a72400e58ecd99ee497cf89e3775d4bd732f'
						: tokenAddress;
					const assetAddress = ethers.utils.getAddress(address);
					const assetId = addressMap[assetAddress];
					if (!assetId) {
						continue;
					}

					const uniTokenBalanceNumber = new BigNumber(pool.uniTokenBalance);
					const totalUniTokenBalanceNumber = new BigNumber(pool.exchange.totalUniToken);
					const totalEtherBalanceNumber = new BigNumber(pool.exchange.ethBalance);
					const totalTokenBalanceNumber = new BigNumber(pool.exchange.tokenBalance);

					const etherPerUniTokenNumber = totalEtherBalanceNumber.div(totalUniTokenBalanceNumber);
					const tokenPerUniTokenNumber = totalTokenBalanceNumber.div(totalUniTokenBalanceNumber);

					const uniTokenBalance = uniTokenBalanceNumber.times('1e18').toString();
					const etherPerUniToken = etherPerUniTokenNumber.toString();
					const tokenPerUniToken = tokenPerUniTokenNumber.toString();

					const id = `${assetId}_eth`;
					const components = [{
						assetId: 'eth',
						amount: etherPerUniToken,
					}, {
						assetId,
						amount: tokenPerUniToken,
					}];
					Vue.set(wallet.investments.uniswap, id, uniTokenBalance);
					Vue.set(this.components.uniswap, id, components);
				}
			}
		},
		async _loadTokenSets() {
			const walletCount = this.wallets.length;
			const addresses = this.wallets.map(wallet => wallet.address);
			const data = await Loader.loadTokenSets(addresses);
			for (let i = 0; i < walletCount; i++) {
				const address = addresses[i];
				const walletBalance = data[`user_${address}`];
				if (!walletBalance) {
					continue;
				}
				const sets = walletBalance.balances;
				const wallet = this.wallets[i];
				const addressMap = Converter.reverseMap(tokenAddresses);
				for (const set of sets) {
					const id = set.set_.set_.symbol.toLowerCase();
					const balance = set.balance;
					const units = set.set_.set_.units;
					const unitsNumber = new BigNumber(units);
					const naturalUnit = set.set_.set_.naturalUnit;
					const underlyingComponents = set.set_.underlyingSet.components;
					const underlyingUnits = set.set_.underlyingSet.units;
					const underlyingNaturalUnit = set.set_.underlyingSet.naturalUnit;
					const componentCount = underlyingComponents.length;
					const components = [];
					for (let i = 0; i < componentCount; i++) {
						const componentAddress = ethers.utils.getAddress(underlyingComponents[i]);
						const componentAssetId = addressMap[componentAddress];
						const componentUnit = underlyingUnits[i];
						const componentBalance = unitsNumber.times(componentUnit).div(underlyingNaturalUnit).div(naturalUnit).times('1e18');
						const componentAmount = Converter.toAmount(componentBalance, componentAssetId);
						const component = {
							assetId: componentAssetId,
							amount: componentAmount,
						};
						components.push(component);
					}
					Vue.set(wallet.investments.tokensets, id, balance);
					Vue.set(this.components.tokensets, id, components);
				}
			}
		},
		async _loadMelon() {
			const walletCount = this.wallets.length;
			const addresses = this.wallets.map(wallet => wallet.address);
			const data = await Loader.loadMelon(addresses);
			for (let i = 0; i < walletCount; i++) {
				const address = addresses[i];
				const walletBalance = data[`user_${address}`];
				if (!walletBalance) {
					continue;
				}
				const investments = walletBalance.investments;
				const wallet = this.wallets[i];
				const addressMap = Converter.reverseMap(tokenAddresses);
				for (const investment of investments) {
					const id = investment.fund.name;
					const balance = investment.shares;
					const totalShares = investment.fund.totalSupply;
					if (totalShares == 0) {
						continue;
					}
					const currentHoldings = investment.fund.holdingsHistory
						.filter((holding, index, array) => holding.timestamp === array[0].timestamp && !new BigNumber(holding.amount).isZero());
					const holdingCount = currentHoldings.length;
					const components = [];
					for (let i = 0; i < holdingCount; i++) {
						const holding = currentHoldings[i];
						const holdingAmount = holding.amount;
						const holdingAmountNumber = new BigNumber(holdingAmount);
						const holdingAsset = holding.asset.id;
						const componentAddress = ethers.utils.getAddress(holdingAsset);
						const componentAssetId = addressMap[componentAddress];
						const componentAmount = holdingAmountNumber.div(totalShares).toString();
						const component = {
							assetId: componentAssetId,
							amount: componentAmount,
						};
						components.push(component);
					}
					Vue.set(wallet.investments.melon, id, balance);
					Vue.set(this.components.melon, id, components);
				}
			}
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
