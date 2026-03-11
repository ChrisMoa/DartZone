import { browser } from '$app/environment';

const STORAGE_KEY = 'dartzone_settings';

export interface AppSettings {
	// Animation settings
	animationsEnabled: boolean;
	animationBullseye: boolean;
	animationTripleTwenty: boolean;
	animationOneEighty: boolean;
	animationCheckout: boolean;

	// Match defaults
	defaultGameMode: '501' | '301';
	defaultSoftCheckout: boolean;
	defaultLegsPerMatch: number;
	timerEnabled: boolean;

	// Display
	inputMode: 'dartboard' | 'keypad' | 'both';
	showCheckoutHelper: boolean;
}

const DEFAULTS: AppSettings = {
	animationsEnabled: true,
	animationBullseye: true,
	animationTripleTwenty: true,
	animationOneEighty: true,
	animationCheckout: true,

	defaultGameMode: '501',
	defaultSoftCheckout: false,
	defaultLegsPerMatch: 5,
	timerEnabled: true,

	inputMode: 'dartboard',
	showCheckoutHelper: true,
};

function loadSettings(): AppSettings {
	if (!browser) return { ...DEFAULTS };
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored) {
		try {
			const parsed = JSON.parse(stored);
			return { ...DEFAULTS, ...parsed };
		} catch { /* ignore */ }
	}

	// Migrate old localStorage keys
	const migrated = { ...DEFAULTS };
	const oldTimer = localStorage.getItem('dartzone_timer_enabled');
	if (oldTimer !== null) {
		migrated.timerEnabled = oldTimer !== 'false';
		localStorage.removeItem('dartzone_timer_enabled');
	}
	const oldInput = localStorage.getItem('dartzone_input_mode');
	if (oldInput === 'dartboard' || oldInput === 'keypad' || oldInput === 'both') {
		migrated.inputMode = oldInput;
		localStorage.removeItem('dartzone_input_mode');
	}

	return migrated;
}

export function createSettingsStore() {
	let settings = $state<AppSettings>(loadSettings());

	function persist() {
		if (browser) localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	}

	function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
		settings = { ...settings, [key]: value };
		persist();
	}

	function resetSection(section: 'animations' | 'match' | 'display') {
		const keys: Record<string, (keyof AppSettings)[]> = {
			animations: ['animationsEnabled', 'animationBullseye', 'animationTripleTwenty', 'animationOneEighty', 'animationCheckout'],
			match: ['defaultGameMode', 'defaultSoftCheckout', 'defaultLegsPerMatch', 'timerEnabled'],
			display: ['inputMode', 'showCheckoutHelper'],
		};
		const reset: Partial<AppSettings> = {};
		for (const k of keys[section]) {
			(reset as Record<string, unknown>)[k] = DEFAULTS[k];
		}
		settings = { ...settings, ...reset };
		persist();
	}

	function resetAll() {
		settings = { ...DEFAULTS };
		persist();
	}

	function exportJSON(): string {
		return JSON.stringify(settings, null, 2);
	}

	function importJSON(json: string): boolean {
		try {
			const parsed = JSON.parse(json);
			settings = { ...DEFAULTS, ...parsed };
			persist();
			return true;
		} catch {
			return false;
		}
	}

	/** Check if a specific animation type is enabled */
	function isAnimationEnabled(type: string): boolean {
		if (!settings.animationsEnabled) return false;
		switch (type) {
			case 'bullseye': return settings.animationBullseye;
			case 'triple_twenty': return settings.animationTripleTwenty;
			case 'one_eighty': return settings.animationOneEighty;
			case 'checkout': return settings.animationCheckout;
			default: return true;
		}
	}

	return {
		get settings() { return settings; },
		get defaults() { return DEFAULTS; },
		update,
		resetSection,
		resetAll,
		exportJSON,
		importJSON,
		isAnimationEnabled,
	};
}

export type SettingsStore = ReturnType<typeof createSettingsStore>;
