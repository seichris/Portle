import Converter from './converter.js';
import Wallets from './wallets.js';

class Exporter {
	static toCsv(wallets, prices) {
		const assets = Wallets.getAssets(wallets);
		const rows = [
			'wallet, ticker, amount, price',
		];
		for (const asset of assets) {
			const assetId = asset.id;
			const price = prices[assetId];
			const amount = Converter.toAmount(asset.balance, assetId);
			const walletAddress = wallets[asset.walletId].address;
			const rowData = [
				walletAddress,
				assetId,
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
