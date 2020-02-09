import Vue from 'vue';
import VueRouter from 'vue-router';
import Vuex from 'vuex';

import App from './App.vue';

import Login from './pages/Login.vue';
import Portfolio from './pages/Portfolio.vue';
import NewWallet from './pages/NewWallet.vue';
import Wallet from './pages/Wallet.vue';

import Asset from './pages/view/Asset.vue';
import Deposit from './pages/view/Deposit.vue';
import Investment from './pages/view/Investment.vue';
import Stake from './pages/view/Stake.vue';

Vue.use(VueRouter);
Vue.use(Vuex);

const routes = [
	{ path: '/login', component: Login },
	{ path: '/', component: Portfolio },
	{ path: '/wallet/new', component: NewWallet },
	{ path: '/wallet/:wallet', component: Wallet },

	{ path: '/wallet/:wallet/asset/:assetId', component: Asset },
	{ path: '/wallet/:wallet/deposit/:protocolId/:assetId', component: Deposit },
	{ path: '/wallet/:wallet/investment/:protocolId/:investmentId', component: Investment },
	{ path: '/wallet/:wallet/stake/:assetId/:poolId', component: Stake },
];

const router = new VueRouter({
	mode: 'history',
	routes,
});

const store = new Vuex.Store({
	state: {
		wallets: [],
		components: {},
		prices: {},
		rates: {},
	},
	mutations: {
		setWallets(state, wallets) {
			state.wallets = wallets;
		},
		setComponents(state, components) {
			state.components = components;
		},
		setPrices(state, prices) {
			state.prices = prices;
		},
		setRates(state, rates) {
			state.rates = rates;
		},
		removeWallet(state, wallet) {
			const index = state.wallets.indexOf(wallet);
			state.wallets.splice(index, 1);
		},
	},
});

new Vue({
	router,
	store,
	el: '#app',
	render: h => h(App),
});
