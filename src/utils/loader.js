import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import EthCall from 'ethcall';

import Converter from './converter.js';
import Wallets from './wallets.js';

import erc20Abi from '../data/abi/erc20.json';

import tokenAddresses from '../data/addresses.json';
import tokenDecimals from '../data/decimals.json';

class Loader {
	static async loadWallets(addresses) {
		const wallets = addresses.map(() => {
			return {};
		});

		const promises = [
			this.processAssets(addresses),
			this.processDeposits(addresses),
			this.processInvestments(addresses),
		];
		const data = await Promise.all(promises);

		const addressCount = addresses.length;
		for (let i = 0; i < addressCount; i++) {
			wallets[i].address = addresses[i];
			wallets[i].assets = data[0].assets[i];
			wallets[i].deposits = data[1].deposits[i];
			wallets[i].investments = data[2].investments[i];
		}
		const rates = data[1].rates;
		const components = data[2].components;

		const prices = await this.processPrices(wallets, components);

		return {
			wallets,
			prices,
			rates,
			components,
		};
	}

	static async processPrices(wallets, components) {
		const assets = Wallets.getAssets(wallets);
		const deposits = Wallets.getDeposits(wallets);
		const investments = Wallets.getInvestments(wallets);
		const assetSet = {};
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
			const investmentComponents = components[protocolId][id];
			for (const component of investmentComponents) {
				const { assetId } = component;
				assetSet[assetId] = true;
			}
		}
		const assetIds = Object.keys(assetSet);
		const prices = await fetchPrices(assetIds);
		return prices;
	}

	static async processAssets(addresses) {
		const assets = addresses.map(() => {
			return {};
		});
		const addressAssets = await fetchAssets(addresses);
		const addressCount = addresses.length;
		for (let i = 0; i < addressCount; i++) {
			const address = addresses[i];
			assets[i] = addressAssets[address];
		}
		return {
			assets,
		};
	}

	static async processDeposits(addresses) {
		const deposits = addresses.map(() => {
			return {};
		});
		const rates = {
			supply: {},
		};
		const promises = [
			this.processAave(addresses),
			this.processCompound(addresses),
			this.processDydx(addresses),
			this.processFulcrum(addresses),
			this.processMaker(addresses),
		];
		const depositData = await Promise.all(promises);

		const addressCount = addresses.length;
		for (let i = 0; i < addressCount; i++) {
			deposits[i].aave = depositData[0].deposits[i];
			deposits[i].compound = depositData[1].deposits[i];
			deposits[i].dydx = depositData[2].deposits[i];
			deposits[i].fulcrum = depositData[3].deposits[i];
			deposits[i].maker = depositData[4].deposits[i];
		}

		rates.supply.aave = depositData[0].rates.supply;
		rates.supply.compound = depositData[1].rates.supply;
		rates.supply.dydx = depositData[2].rates.supply;
		rates.supply.fulcrum = depositData[3].rates.supply;
		rates.supply.maker = depositData[4].rates.supply;

		return {
			deposits,
			rates,
		};
	}

	static async processInvestments(addresses) {
		const investments = addresses.map(() => {
			return {};
		});
		const components = {};
		const promises = [
			this.processMelon(addresses),
			this.processTokenSets(addresses),
			this.processUniswap(addresses),
		];
		const investmentData = await Promise.all(promises);

		const addressCount = addresses.length;
		for (let i = 0; i < addressCount; i++) {
			investments[i].melon = investmentData[0].investments[i];
			investments[i].tokensets = investmentData[1].investments[i];
			investments[i].uniswap = investmentData[2].investments[i];
		}

		components.melon = investmentData[0].components;
		components.tokensets = investmentData[1].components;
		components.uniswap = investmentData[2].components;

		return {
			investments,
			components,
		};
	}

	static async processAave(addresses) {
		const deposits = addresses.map(() => {
			return {};
		});
		const rates = {
			supply: {},
		};
		const addressCount = addresses.length;

		const data = await fetchAave(addresses);
		for (let i = 0; i < addressCount; i++) {
			const address = addresses[i];
			const walletBalance = data[`user_${address}`];
			if (!walletBalance) {
				continue;
			}
			const reserves = walletBalance.reserves;
			for (const userReserve of reserves) {
				const addressMap = Converter.reverseMap(tokenAddresses);
				const rawAssetAddress = userReserve.reserve.aToken.underlyingAssetAddress;
				const assetAddress = ethers.utils.getAddress(rawAssetAddress);
				const assetId = assetAddress == '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
					? 'eth'
					: addressMap[assetAddress];
				const liquidityIndex = userReserve.reserve.liquidityIndex;
				const userBalanceIndex = userReserve.userBalanceIndex;
				const tokenRawBalance = userReserve.principalATokenBalance;
				if (userBalanceIndex == 0) {
					continue;
				}

				const ten = new BigNumber(10);
				const decimals = tokenDecimals[assetId];
				const multiplier = ten.pow(decimals);
				const tokenRawBalanceNumber = new BigNumber(tokenRawBalance);
				const tokenBalanceNumber = tokenRawBalanceNumber
					.times(multiplier).times(liquidityIndex).div(userBalanceIndex);
				const tokenBalance = tokenBalanceNumber.toString();
				deposits[i][assetId] = tokenBalance;

				const supplyRate = userReserve.reserve.liquidityRate;
				rates.supply[assetId] = supplyRate;
			}
		}

		return {
			deposits,
			rates,
		};
	}

	static async processCompound(addresses) {
		const deposits = addresses.map(() => {
			return {};
		});
		const rates = {
			supply: {},
		};
		const addressCount = addresses.length;

		const data = await fetchCompound(addresses);
		for (let i = 0; i < addressCount; i++) {
			const address = addresses[i];
			const walletBalance = data[`user_${address}`];
			if (!walletBalance) {
				continue;
			}
			const balances = walletBalance.balances;
			for (const balance of balances) {
				const addressMap = Converter.reverseMap(tokenAddresses);
				const assetAddress = ethers.utils.getAddress(balance.token.underlying.address);
				const assetId = addressMap[assetAddress];
				const supplyIndex = balance.token.supplyIndex;
				const tokenRawBalance = balance.balance;

				const tokenRawBalanceNumber = new BigNumber(tokenRawBalance);
				const tokenBalanceNumber = tokenRawBalanceNumber.times(supplyIndex).div('1e18');
				const tokenBalance = tokenBalanceNumber.toString();
				deposits[i][assetId] = tokenBalance;

				const supplyRawRate = balance.token.supplyRate;
				const supplyRawRateNumber = new BigNumber(supplyRawRate);
				const supplyRateNumber = supplyRawRateNumber.times('2102400').div('1e18');
				const supplyRate = supplyRateNumber.toString();
				rates.supply[assetId] = supplyRate;
			}
		}

		return {
			deposits,
			rates,
		};
	}

	static async processDydx(addresses) {
		const deposits = addresses.map(() => {
			return {};
		});
		const rates = {
			supply: {},
		};
		const addressCount = addresses.length;

		const data = await fetchDydx(addresses);
		const markets = data.markets;
		for (const market of markets) {
			const addressMap = Converter.reverseMap(tokenAddresses);
			const assetAddress = ethers.utils.getAddress(market.token.address);
			const assetId = addressMap[assetAddress];

			const supplyRawRate = market.supplyRate;
			const supplyRawRateNumber = new BigNumber(supplyRawRate);
			const supplyRateNumber = supplyRawRateNumber.div('1e18');
			const supplyRate = supplyRateNumber.toString();
			rates.supply[assetId] = supplyRate;
		}

		for (let i = 0; i < addressCount; i++) {
			const address = addresses[i];
			const walletBalance = data[`user_${address}`];
			if (!walletBalance) {
				continue;
			}
			const balances = walletBalance.balances;

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
				deposits[i][assetId] = marketBalance;
			}
		}

		return {
			deposits,
			rates,
		};
	}

	static async processFulcrum(addresses) {
		const deposits = addresses.map(() => {
			return {};
		});
		const rates = {
			supply: {},
		};
		const addressCount = addresses.length;

		const data = await fetchFulcrum(addresses);
		for (let i = 0; i < addressCount; i++) {
			const address = addresses[i];
			const walletBalance = data[`user_${address}`];
			if (!walletBalance) {
				continue;
			}
			const balances = walletBalance.balances;
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
				deposits[i][assetId] = tokenBalance;
				// Set rates
				const supplyRawRate = balance.token.supplyRate;
				const supplyRawRateNumber = new BigNumber(supplyRawRate);
				const supplyRateNumber = supplyRawRateNumber.div('1e18').div('1e2');
				const supplyRate = supplyRateNumber.toString();
				rates.supply[assetId] = supplyRate;
			}
		}

		return {
			deposits,
			rates,
		};
	}

	static async processMaker(addresses) {
		const deposits = addresses.map(() => {
			return {};
		});
		const rates = {
			supply: {},
		};
		const addressCount = addresses.length;

		const data = await fetchMaker(addresses);
		const maker = data.maker;
		const index = maker.index;
		const rawRate = maker.rate;
		const rawRateNumber = new BigNumber(rawRate);
		const rateNumber = rawRateNumber.div('1e27').minus(1).times(60 * 60 * 24 * 365);
		const rate = rateNumber.toString();
		rates.supply['dai'] = rate;

		for (let i = 0; i < addressCount; i++) {
			const address = addresses[i];
			const user = data[`user_${address}`];
			if (!user) {
				continue;
			}
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
			deposits[i]['dai'] = totalBalance;
		}

		return {
			deposits,
			rates,
		};
	}

	static async processMelon(addresses) {
		const investments = addresses.map(() => {
			return {};
		});
		const components = {};
		const addressCount = addresses.length;

		const data = await fetchMelon(addresses);
		for (let i = 0; i < addressCount; i++) {
			const address = addresses[i];
			const walletBalance = data[`user_${address}`];
			if (!walletBalance) {
				continue;
			}
			const investments = walletBalance.investments;
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
				const investmentComponents = [];
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
					investmentComponents.push(component);
				}
				investments[i][id] = balance;
				components[id] = investmentComponents;
			}
		}

		return {
			investments,
			components,
		};
	}

	static async processTokenSets(addresses) {
		const investments = addresses.map(() => {
			return {};
		});
		const components = {};
		const addressCount = addresses.length;

		const data = await fetchTokenSets(addresses);
		for (let i = 0; i < addressCount; i++) {
			const address = addresses[i];
			const walletBalance = data[`user_${address}`];
			if (!walletBalance) {
				continue;
			}
			const sets = walletBalance.balances;
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
				const investmentComponents = [];
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
					investmentComponents.push(component);
				}
				investments[i][id] = balance;
				components[id] = investmentComponents;
			}
		}

		return {
			investments,
			components,
		};
	}

	static async processUniswap(addresses) {
		const investments = addresses.map(() => {
			return {};
		});
		const components = {};
		const addressCount = addresses.length;

		const data = await fetchUniswap(addresses);
		for (let i = 0; i < addressCount; i++) {
			const address = addresses[i];
			const walletBalance = data[`user_${address}`];
			if (!walletBalance) {
				continue;
			}
			const pools = walletBalance.exchangeBalances;
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
				const investmentComponents = [{
					assetId: 'eth',
					amount: etherPerUniToken,
				}, {
					assetId,
					amount: tokenPerUniToken,
				}];
				investments[i][id] = uniTokenBalance;
				components[id] = investmentComponents;
			}
		}

		return {
			investments,
			components,
		};
	}
}

async function fetchPrices(assets) {
	const assetString = assets.join('%2C');
	const url = `https://api.portle.io/price?assets=${assetString}`;
	const response = await fetch(url);
	const prices = await response.json();
	return prices; 
}

async function fetchAssets(addresses) {
	const addressCount = addresses.length;
	const amberdataKey = 'UAKcba96395cf4b76e0d532cbae62a2bf6e';
	const headers = {
		'x-api-key': amberdataKey,
	};
	const balancePromises = [];
	for (const address of addresses) {
		const url = `https://web3api.io/api/v2/addresses/${address}/tokens`;
		try {
			const balancePromise = fetch(url, {
				headers,
			});
			balancePromises.push(balancePromise);
		} catch(e) {
			const emptyBalance = {
				json: function() {
					return {
						payload: {
							records: [],
						},
					};
				},
			};
			balancePromises.push(emptyBalance);
		}
	}
	const balanceResponses = await Promise.all(balancePromises);
	const jsonPromises = [];
	for (const balanceResponse of balanceResponses) {
		const jsonPromise = balanceResponse.json();
		jsonPromises.push(jsonPromise);
	}
	const balanceJson = await Promise.all(jsonPromises);
	const balances = {};
	for (const address of addresses) {
		balances[address] = {};
	}
	const addressMap = Converter.reverseMap(tokenAddresses);
	for (let i = 0; i < addressCount; i++) {
		const json = balanceJson[i];
		const address = addresses[i];
		const tokens = json.payload.records;
		for (const tokenData of tokens) {
			const assetAddress = ethers.utils.getAddress(tokenData.address);
			if (!assetAddress) {
				continue;
			}
			const assetId = addressMap[assetAddress];
			if (!assetId) {
				continue;
			}
			const balance = tokenData.amount;
			balances[address][assetId] = balance;
		}
	}

	const provider = getProvider();
	const wethContract = new EthCall.Contract(tokenAddresses['weth'], erc20Abi);
	const amplContract = new EthCall.Contract(tokenAddresses['ampl'], erc20Abi);

	const calls = [];
	for (let i = 0; i < addressCount; i++) {
		const address = addresses[i];
		const ethBalanceCall = EthCall.calls.getEthBalance(address);
		const wethBalanceCall = wethContract.balanceOf(address);
		const amplBalanceCall = amplContract.balanceOf(address);
		calls.push(ethBalanceCall);
		calls.push(wethBalanceCall);
		calls.push(amplBalanceCall);
	}

	const balanceData = await EthCall.all(calls, provider);
	for (let i = 0; i < addressCount; i++) {
		const address = addresses[i];
		balances[address]['eth'] = balanceData[3 * i].toString();
		balances[address]['weth'] = balanceData[3 * i + 1].toString();
		balances[address]['ampl'] = balanceData[3 * i + 2].toString();
	}
	return balances;
}

async function fetchAave(addresses) {
	const url = 'https://api.thegraph.com/subgraphs/name/aave/protocol';
	const addressQuery = addresses
		.map(address => { return `
			user_${address}: user(id: "${address}") {
				reserves {
					reserve {
						liquidityIndex
						liquidityRate
						aToken {
							underlyingAssetAddress
						}
					}
					userBalanceIndex
					principalATokenBalance
				}
			}
		`;})
		.join('');
	const query = `
		query {
			${addressQuery}
		}`;
	const opts = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query }),
	};
	const response = await fetch(url, opts);
	const json = await response.json();
	const data = json.data;
	return data;
}

async function fetchCompound(addresses) {
	const url = 'https://api.thegraph.com/subgraphs/name/destiner/compound';
	const addressQuery = addresses
		.map(address => { return `
			user_${address}: user(id: "${address}") {
				balances {
					token {
						supplyRate
						supplyIndex
						underlying {
							address
						}
					}
					balance
				}
			}
		`;})
		.join('');
	const query = `
		query {
			${addressQuery}
		}`;
	const opts = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query }),
	};
	const response = await fetch(url, opts);
	const json = await response.json();
	const data = json.data;
	return data;
}

async function fetchDydx(addresses) {
	const url = 'https://api.thegraph.com/subgraphs/name/destiner/dydx';
	const addressQuery = addresses
		.map(address => { return `
			user_${address}: user(id: "${address}") {
				balances {
					balance
					market {
						token {
							address
						}
						supplyIndex
						supplyRate
					}
				}
			}
		`;})
		.join('');
	const query = `
		query {
			markets {
				token {
					id
					address
				}
				supplyIndex
				supplyRate
			}
			${addressQuery}
		}`;
	const opts = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query }),
	};
	const response = await fetch(url, opts);
	const json = await response.json();
	const data = json.data;
	return data;
}

async function fetchFulcrum(addresses) {
	const url = 'https://api.thegraph.com/subgraphs/name/destiner/fulcrum';
	const addressQuery = addresses
		.map(address => { return `
			user_${address}: user(id: "${address}") {
				balances {
					token {
						symbol
						supplyIndex
						supplyRate
						underlying {
							address
						}
					}
					balance
				}
			}
		`;})
		.join('');
	const query = `
		query {
			${addressQuery}
		}`;
	const opts = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query }),
	};
	const response = await fetch(url, opts);
	const json = await response.json();
	const data = json.data;
	return data;
}

async function fetchMaker(addresses) {
	const url = 'https://api.thegraph.com/subgraphs/name/destiner/maker';
	const addressQuery = addresses
		.map(address => { return `
			user_${address}: user(id: "${address}") {
				id
				balance
				chaiBalance
				proxy {
					id
					balance
				}
			}
		`;})
		.join('');
	const query = `
		query {
			maker(id: 0) {
				index
				rate
			}
			${addressQuery}
		}`;
	const opts = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query }),
	};
	const response = await fetch(url, opts);
	const json = await response.json();
	const data = json.data;
	return data;
}

async function fetchUniswap(addresses) {
	const url = 'https://api.thegraph.com/subgraphs/name/graphprotocol/uniswap';
	const addressQuery = addresses
		.map(address => { return `
			user_${address}: user(id: "${address}") {
				exchangeBalances(where: {
					uniTokenBalance_gt: 0
				}) {
					uniTokenBalance
					exchange {
						id
						tokenAddress
						totalUniToken
						ethBalance
						tokenBalance
					}
				}
			}
		`;})
		.join('');
	const query = `
		query {
			${addressQuery}
		}`;
	const opts = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query }),
	};
	const response = await fetch(url, opts);
	const json = await response.json();
	const data = json.data;
	return data;
}

async function fetchTokenSets(addresses) {
	const url = 'https://api.thegraph.com/subgraphs/name/destiner/token-sets';
	const addressQuery = addresses
		.map(address => { return `
			user_${address}: user(id: "${address}") {
				balances {
					balance
					set_ {
						set_ {
							symbol
							units
							naturalUnit
						}
						underlyingSet {
							components
							units
							naturalUnit
						}
					}
				}
			}
		`;})
		.join('');
	const query = `
		query {
			${addressQuery}
		}`;
	const opts = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query }),
	};
	const response = await fetch(url, opts);
	const json = await response.json();
	const data = json.data;
	return data;	
}

async function fetchMelon(addresses) {
	const url = 'https://api.thegraph.com/subgraphs/name/melonproject/melon';
	const addressQuery = addresses
		.map(address => { return `
			user_${address}: investor(id: "${address}") {
				investments {
					shares
					fund {
						name
						totalSupply
						holdingsHistory(orderBy: timestamp, orderDirection: desc) {
							timestamp
							amount
							assetGav
							asset {
								id
							}
						}
					}
				}
			}
		`;})
		.join('');
	const query = `
		query {
			${addressQuery}
		}`;
	const opts = {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query }),
	};
	const response = await fetch(url, opts);
	const json = await response.json();
	const data = json.data;
	return data;	
}

function getProvider() {
	const web3Endpoint = 'https://mainnet.infura.io/v3/93e3393c76ed4e1f940d0266e2fdbda2';
	const provider = new ethers.providers.JsonRpcProvider(web3Endpoint);
	return provider;
}

export default Loader;
