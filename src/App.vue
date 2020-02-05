<template>
	<div id="app">
		<header v-if="showNavigation()">
			<div class="header-part">
				<router-link
					id="app-title"
					:to="'/'"
				>
					Portle
				</router-link>
			</div>
		</header>
		<main>
			<router-view :key="$route.fullPath" />
		</main>
		<footer v-if="showNavigation()">
			<div>
				<a
					href="https://twitter.com/PortleApp"
					class="social-link"
					target="_blank"
				>
					Twitter
				</a>
				<a
					href="https://github.com/Destiner/Portle"
					class="social-link"
					target="_blank"
				>
					GitHub
				</a>
			</div>
		</footer>
	</div>
</template>

<script>
// eslint-disable-next-line no-unused-vars
import favicon from '../public/favicon.ico';
// eslint-disable-next-line no-unused-vars
import card from '../public/img/card.png';
import logo from '../public/img/logo.svg';

export default {
	methods: {
		showNavigation() {
			const path = this.$route.path;
			if (path == '/login') {
				return false;
			}
			return true;
		},
	},
};
</script>

<style>
@import url('https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,700&display=swap');

:root {
	--brand-color: #140925;
	--accent-color: #efb22d;
	--primary-text-color: #1a202c;
	--secondary-text-color: #4a5568;
	--inverted-primary-text-color: #edf2f7;
	--inverted-secondary-text-color: #c6beca;
	--outline-color: #e7e8ea;
	--cover-color: #ededed;
	--background-color: white;
	--error-color: #c80815;
}

body {
	margin: 0;
	color: var(--primary-text-color);
	background: var(--background-color);
	font-family: 'Source Sans Pro', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

#app {
	height: 100vh;
}

header {
	height: 64px;
	padding: 0 1em;
	display: flex;
	justify-content: space-between;
	background: var(--brand-color);
}

main {
	min-height: calc(100% - 96px);
}

#app-title {
	margin: 0.25em 0;
	font-size: 1.5em;
	font-weight: normal;
	color: var(--inverted-primary-text-color);
	cursor: pointer;
}

footer {
	margin: 0 1em;
	height: 32px;
}

h2 {
	font-size: 1.25em;
	margin: 1em 0 0.25em 0;
}

a {
	text-decoration: none;
}

button {
	padding: 0 1rem;
	font-size: 0.75em;
	height: 2rem;
	min-width: 2rem;
	cursor: pointer;
	border: none;
	background: var(--accent-color);
	color: var(--primary-text-color);
	border-radius: 4px;
}

button.big {
	padding: 0 1.5em;
	font-size: 1em;
	height: 4em;
}

button:hover {
	background: #e6a10d;
	box-shadow: rgba(0, 0, 0, 0.2) 0 2px 4px;
}

button:active {
	background: #d79406;
}

button:disabled {
	opacity: 0.5;
	pointer-events: none;
}
</style>

<style scoped>
.header-part {
	display: flex;
	align-items: center;
}

.social-link {
	font-size: 0.875em;
	text-decoration: none;
	color: var(--secondary-text-color);
	margin-right: 0.5em;
}

.social-link:hover {
	color: var(--primary-text-color);
}
</style>
