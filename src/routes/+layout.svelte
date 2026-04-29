<script lang="ts">
	import '../app.css';
	import { setContext } from 'svelte';
	import { createThemeStore } from '$lib/stores/theme.svelte.js';
	import { createSettingsStore } from '$lib/stores/settings.svelte.js';

	let { children } = $props();
	const themeStore = createThemeStore();
	const settingsStore = createSettingsStore();
	setContext('theme', themeStore);
	setContext('settings', settingsStore);

	let mobileOpen = $state(false);

	$effect(() => {
		themeStore.apply();
	});

	const navItems = [
		{ href: '/clubs', label: 'Vereine' },
		{ href: '/tournaments', label: 'Turniere' },
		{ href: '/stats', label: 'Statistiken' },
		{ href: '/import', label: 'Excel-Import' },
		{ href: '/export', label: 'Backup' },
		{ href: '/feedback', label: 'Feedback' }
	];
</script>

<svelte:head>
	<title>DartZone</title>
</svelte:head>

<div class="min-h-screen">
	<a href="#main-content" class="skip-link">Zum Inhalt springen</a>
	<nav
		class="navbar navbar-glass shadow-sm sticky top-0 z-40 border-b border-base-300/40"
		aria-label="Hauptnavigation"
	>
		<div class="flex-1 gap-2">
			<button
				class="btn btn-ghost btn-circle md:hidden"
				aria-label="Menü öffnen"
				onclick={() => (mobileOpen = !mobileOpen)}
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
				</svg>
			</button>
			<a
				href="/"
				class="btn btn-ghost gap-2 px-2"
				title="DartZone v{__APP_VERSION__} (Build: {__APP_BUILD_DATE__})"
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-7 w-7 shrink-0" aria-hidden="true">
					<circle cx="12" cy="12" r="11" fill="var(--color-primary)" />
					<circle cx="12" cy="12" r="9" fill="none" stroke="var(--color-base-100)" stroke-width="0.5" opacity="0.4" />
					<path d="M12 1 A11 11 0 0 1 21.5 6.5 L12 12 Z" fill="var(--color-error)" opacity="0.85" />
					<path d="M21.5 6.5 A11 11 0 0 1 21.5 17.5 L12 12 Z" fill="var(--color-base-100)" opacity="0.15" />
					<path d="M21.5 17.5 A11 11 0 0 1 12 23 L12 12 Z" fill="var(--color-error)" opacity="0.85" />
					<path d="M12 23 A11 11 0 0 1 2.5 17.5 L12 12 Z" fill="var(--color-base-100)" opacity="0.15" />
					<path d="M2.5 17.5 A11 11 0 0 1 2.5 6.5 L12 12 Z" fill="var(--color-error)" opacity="0.85" />
					<path d="M2.5 6.5 A11 11 0 0 1 12 1 L12 12 Z" fill="var(--color-base-100)" opacity="0.15" />
					<circle cx="12" cy="12" r="3.2" fill="var(--color-base-100)" opacity="0.85" />
					<circle cx="12" cy="12" r="1.4" fill="var(--color-accent)" />
				</svg>
				<span class="font-display text-xl font-extrabold tracking-wide text-primary">DartZone</span>
			</a>
		</div>
		<div class="flex-none flex items-center gap-1">
			<ul class="menu menu-horizontal gap-1 hidden md:flex">
				{#each navItems as item (item.href)}
					<li><a href={item.href}>{item.label}</a></li>
				{/each}
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

	{#if mobileOpen}
		<div class="md:hidden border-b border-base-300/40 navbar-glass">
			<ul class="menu menu-vertical w-full p-2">
				{#each navItems as item (item.href)}
					<li>
						<a href={item.href} onclick={() => (mobileOpen = false)}>{item.label}</a>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	<main id="main-content" class="container mx-auto p-4 max-w-6xl">
		{@render children()}
	</main>
</div>
