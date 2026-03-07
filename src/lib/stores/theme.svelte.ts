import { browser } from '$app/environment';

const STORAGE_KEY = 'dartzone-theme';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

export function createThemeStore() {
	let theme = $state(getInitialTheme());

	function getInitialTheme(): string {
		if (!browser) return LIGHT_THEME;
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) return stored;
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? DARK_THEME : LIGHT_THEME;
	}

	function toggle() {
		theme = theme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
		if (browser) {
			localStorage.setItem(STORAGE_KEY, theme);
			document.documentElement.setAttribute('data-theme', theme);
		}
	}

	function apply() {
		if (browser) {
			document.documentElement.setAttribute('data-theme', theme);
		}
	}

	return {
		get theme() { return theme; },
		get isDark() { return theme === DARK_THEME; },
		toggle,
		apply
	};
}

export type ThemeStore = ReturnType<typeof createThemeStore>;
