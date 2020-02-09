class Wallets {
	static getAssets(wallets) {
		const assets = [];
		if (wallets.length == 0) {
			return assets;
		}
		for (const walletIndex in wallets) {
			const walletId = parseInt(walletIndex);
			const wallet = wallets[walletId];
			for (const id in wallet.assets) {
				const balance = wallet.assets[id];
				if (balance != '0') {
					const asset = {
						walletId,
						id,
						balance,
					};
					assets.push(asset);
				}
			}
		}
		return assets;
	}

	static getDeposits(wallets) {
		const deposits = [];
		if (wallets.length == 0) {
			return deposits;
		}
		for (const walletIndex in wallets) {
			const walletId = parseInt(walletIndex);
			const wallet = wallets[walletId];
			for (const protocolId in wallet.deposits) {
				const protocolBalance = wallet.deposits[protocolId];
				for (const assetId in protocolBalance) {
					const balance = protocolBalance[assetId];
					if (balance != '0') {
						const deposit = {
							walletId,
							protocolId,
							assetId,
							balance,
						};
						deposits.push(deposit);
					}
				}
			}
		}
		return deposits;
	}

	static getInvestments(wallets) {
		const investments = [];
		if (wallets.length == 0) {
			return investments;
		}
		for (const walletIndex in wallets) {
			const walletId = parseInt(walletIndex);
			const wallet = wallets[walletId];
			for (const protocolId in wallet.investments) {
				const protocolBalance = wallet.investments[protocolId];
				for (const id in protocolBalance) {
					const balance = protocolBalance[id];
					if (balance != '0') {
						const investment = {
							walletId,
							protocolId,
							id,
							balance,
						};
						investments.push(investment);
					}
				}
			}
		}
		return investments;
	}

	static getStakes(wallets) {
		const stakes = [];
		if (wallets.length == 0) {
			return stakes;
		}
		for (const walletIndex in wallets) {
			const walletId = parseInt(walletIndex);
			const wallet = wallets[walletId];
			for (const assetId in wallet.stakes) {
				const assetBalance = wallet.stakes[assetId];
				for (const poolId in assetBalance) {
					const balance = assetBalance[poolId];
					if (balance != '0') {
						const investment = {
							walletId,
							assetId,
							poolId,
							balance,
						};
						stakes.push(investment);
					}
				}
			}
		}
		return stakes;
	}
}

export default Wallets;
