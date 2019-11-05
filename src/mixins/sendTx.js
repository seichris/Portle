export const sendTx = {
	data() {
		return {
			txStatus: 'none',
		};
	},
	methods: {
		async _sendTx(provider, txPromise) {
			try {
				this.txStatus = 'pending';
				const tx = await txPromise;
				this.txStatus = 'mining';
				const txReceipt = await provider.waitForTransaction(tx.hash);
				if (txReceipt.status == 1) {
					this.txStatus = 'success';
				} else {
					this.txStatus = 'failure';
				}
			} catch(e) {
				this.txStatus = 'rejected';
			}
		},
	},
};