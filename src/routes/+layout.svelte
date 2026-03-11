<script lang="ts">
	import '../app.css';
	import { setContext } from 'svelte';
	import { createThemeStore } from '$lib/stores/theme.svelte.js';

	let { children } = $props();
	const themeStore = createThemeStore();
	setContext('theme', themeStore);

	$effect(() => {
		themeStore.apply();
	});
</script>

<svelte:head>
	<title>DartZone</title>
</svelte:head>

<div class="min-h-screen bg-base-200">
	<nav class="navbar bg-gradient-to-r from-base-100 to-base-200 shadow-sm sticky top-0 z-40 border-b border-base-300/50">
		<div class="flex-1">
			<a href="/" class="btn btn-ghost text-xl font-bold text-primary">DartZone</a>
		</div>
		<div class="flex-none flex items-center gap-1">
			<ul class="menu menu-horizontal gap-1">
				<li><a href="/clubs">Vereine</a></li>
				<li><a href="/tournaments">Turniere</a></li>
				<li><a href="/stats">Statistiken</a></li>
				<li><a href="/import">Excel-Import</a></li>
				<li><a href="/export">Backup</a></li>
			</ul>
			<a
				href="/settings"
				class="btn btn-ghost btn-circle btn-sm"
				aria-label="Einstellungen"
				data-testid="settings-link"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
			</a>
			<button
				class="btn btn-ghost btn-circle btn-sm"
				onclick={() => themeStore.toggle()}
				aria-label="Theme umschalten"
				data-testid="theme-toggle"
			>
				{#if themeStore.isDark}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
				{:else}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
					</svg>
				{/if}
			</button>
		</div>
	</nav>

	<main class="container mx-auto p-4 max-w-6xl">
		{@render children()}
	</main>
</div>
