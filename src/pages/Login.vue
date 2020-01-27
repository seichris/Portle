<template>
	<div id="view">
		<div id="header">
			<h1 id="title">
				Portle
			</h1>
			<h2 id="subtitle">
				Decentralized finance portfolio tracker
			</h2>
		</div>
		<router-link :to="'/wallet/new'">
			<button
				id="main"
				class="primary big"
			>
				Get started
			</button>
		</router-link>
		<div id="spacer" />
	</div>
</template>

<script>
import Storage from '../utils/storage.js';

export default {
	mounted() {
		const walletList = Storage.getWalletList();
		if (walletList.length > 0) {
			this.$router.push('/');
			return;
		}
	},
};
</script>

<style scoped>
#view {
	height: 95vh;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
}

#header {
	margin-bottom: 4em;
	display: flex;
	flex-direction: column;
	align-items: center;
}

h1#title {
	margin-bottom: 0.125em;
	font-size: 3em;
	font-weight: normal;
}

h2#subtitle {
	font-size: 1.5em;
	font-weight: normal;
	margin: 0 1em;
	color: var(--secondary-text-color);
	text-align: center;
}

#spacer {
	height: 4em;
}
</style>
