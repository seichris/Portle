import Converter from './converter.js';
import Wallets from './wallets.js';

class Exporter {
	static toCsv(wallets, prices) {
		const rows = [];
		const columns = [
			'type',
			'wallet',
			'protocol',
			'ticker',
			'amount',
			'price',
		];
		const header = columns.join(',');
		rows.push(header);

		rows.push('');
		const assets = Wallets.getAssets(wallets);
		for (const asset of assets) {
			const type = 'asset';
			const protocol = '-';
			const assetId = asset.id;
			const price = prices[assetId];
			const amount = Converter.toAmount(asset.balance, assetId);
			const walletAddress = wallets[asset.walletId].address;
			const rowData = [
				type,
				walletAddress,
				protocol,
				assetId,
				amount,
				price,
			];
			const row = rowData.join(',');
			rows.push(row);
		}

		rows.push('');
		const deposits = Wallets.getDeposits(wallets);
		for (const deposit of deposits) {
			const type = 'deposit';
			const protocol = deposit.protocolId;
			const assetId = deposit.assetId;
			const price = prices[assetId];
			const amount = Converter.toAmount(deposit.balance, assetId);
			const walletAddress = wallets[deposit.walletId].address;
			const rowData = [
				type,
				walletAddress,
				protocol,
				assetId,
				amount,
				price,
			];
			const row = rowData.join(',');
			rows.push(row);
		}

		rows.push('');
		const investments = Wallets.getInvestments(wallets);
		for (const investment of investments) {
			const type = 'investment';
			const protocol = investment.protocolId;
			const id = investment.id;
			const price = '-';
			const amount = Converter.toAmount(investment.balance, 'eth');
			const walletAddress = wallets[investment.walletId].address;
			const rowData = [
				type,
				walletAddress,
				protocol,
				id,
				amount,
				price,
			];
			const row = rowData.join(',');
			rows.push(row);
		}

		rows.push('');
		const stakes = Wallets.getStakes(wallets);
		for (const stake of stakes) {
			const type = 'stake';
			const asset = stake.assetId;
			const id = stake.poolId;
			const price = prices[asset];
			const amount = Converter.toAmount(stake.balance, asset);
			const walletAddress = wallets[stake.walletId].address;
			const rowData = [
				type,
				walletAddress,
				asset,
				id,
				amount,
				price,
			];
			const row = rowData.join(',');
			rows.push(row);
		}


		const data = rows.join('\n');
		return data;
	}
}

export default Exporter;
