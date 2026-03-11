import { browser } from '$app/environment';
import {
	COLOR_PRESETS,
	generateLightPalette,
	generateDarkPalette,
	paletteToCSSVars,
	type ColorPreset
} from '$lib/utils/color.js';

const THEME_KEY = 'dartzone-theme';
const COLORS_KEY = 'dartzone-colors';

export interface ThemeColors {
	preset: string | null; // preset name, or null for custom
	primary: string;       // hex
	accent: string;        // hex
}

const DEFAULT_PRESET = COLOR_PRESETS[0]; // forest green

function getInitialMode(): 'light' | 'dark' {
	if (!browser) return 'light';
	const stored = localStorage.getItem(THEME_KEY);
	if (stored === 'dark' || stored === 'light') return stored;
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialColors(): ThemeColors {
	if (!browser) return { preset: DEFAULT_PRESET.name, primary: DEFAULT_PRESET.primary, accent: DEFAULT_PRESET.accent };
	const stored = localStorage.getItem(COLORS_KEY);
	if (stored) {
		try {
			const parsed = JSON.parse(stored);
			if (parsed.primary && parsed.accent) return parsed;
		} catch { /* ignore */ }
	}
	return { preset: DEFAULT_PRESET.name, primary: DEFAULT_PRESET.primary, accent: DEFAULT_PRESET.accent };
}

export function createThemeStore() {
	let mode = $state<'light' | 'dark'>(getInitialMode());
	let colors = $state<ThemeColors>(getInitialColors());

	function applyPalette() {
		if (!browser) return;

		document.documentElement.setAttribute('data-theme', mode);

		const palette = mode === 'dark'
			? generateDarkPalette(colors.primary, colors.accent)
			: generateLightPalette(colors.primary, colors.accent);

		const vars = paletteToCSSVars(palette);
		const root = document.documentElement;
		for (const [key, value] of Object.entries(vars)) {
			root.style.setProperty(key, value);
		}
	}

	function toggle() {
		mode = mode === 'dark' ? 'light' : 'dark';
		if (browser) localStorage.setItem(THEME_KEY, mode);
		applyPalette();
	}

	function setPreset(presetName: string) {
		const preset = COLOR_PRESETS.find((p) => p.name === presetName);
		if (!preset) return;
		colors = { preset: preset.name, primary: preset.primary, accent: preset.accent };
		persist();
		applyPalette();
	}

	function setCustomColors(primary: string, accent: string) {
		colors = { preset: null, primary, accent };
		persist();
		applyPalette();
	}

	function resetToDefault() {
		colors = { preset: DEFAULT_PRESET.name, primary: DEFAULT_PRESET.primary, accent: DEFAULT_PRESET.accent };
		persist();
		applyPalette();
	}

	function persist() {
		if (browser) localStorage.setItem(COLORS_KEY, JSON.stringify(colors));
	}

	function apply() {
		applyPalette();
	}

	return {
		get mode() { return mode; },
		get isDark() { return mode === 'dark'; },
		get colors() { return colors; },
		get presets(): ColorPreset[] { return COLOR_PRESETS; },
		toggle,
		setPreset,
		setCustomColors,
		resetToDefault,
		apply
	};
}

export type ThemeStore = ReturnType<typeof createThemeStore>;
