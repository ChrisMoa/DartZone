/**
 * Color utility for generating a full DaisyUI v5 palette from seed colors.
 * DaisyUI v5 uses oklch() CSS variables.
 */

export interface HSL {
	h: number; // 0-360
	s: number; // 0-100
	l: number; // 0-100
}

/** oklch color representation */
export interface OKLCH {
	l: number; // 0-1 (lightness)
	c: number; // 0-0.4 (chroma)
	h: number; // 0-360 (hue)
}

export interface ThemePalette {
	primary: OKLCH;
	primaryContent: OKLCH;
	secondary: OKLCH;
	secondaryContent: OKLCH;
	accent: OKLCH;
	accentContent: OKLCH;
	neutral: OKLCH;
	neutralContent: OKLCH;
	base100: OKLCH;
	base200: OKLCH;
	base300: OKLCH;
	baseContent: OKLCH;
	info: OKLCH;
	infoContent: OKLCH;
	success: OKLCH;
	successContent: OKLCH;
	warning: OKLCH;
	warningContent: OKLCH;
	error: OKLCH;
	errorContent: OKLCH;
}

export interface ColorPreset {
	name: string;
	label: string;
	primary: string; // hex
	accent: string;  // hex
}

export const COLOR_PRESETS: ColorPreset[] = [
	{ name: 'forest', label: 'Waldgruen', primary: '#2d6a4f', accent: '#95d5b2' },
	{ name: 'royal', label: 'Koenigsblau', primary: '#1d3557', accent: '#a8dadc' },
	{ name: 'crimson', label: 'Karminrot', primary: '#9b2226', accent: '#f4a261' },
	{ name: 'gold', label: 'Dunkelgold', primary: '#6b4226', accent: '#e9c46a' },
	{ name: 'purple', label: 'Violett', primary: '#5a189a', accent: '#c77dff' },
	{ name: 'teal', label: 'Petrol', primary: '#0d6e6e', accent: '#99e2b4' },
];

// ─── Hex ↔ sRGB ↔ linear RGB ↔ OKLab ↔ OKLCH conversions ────────────

function hexToRGB(hex: string): [number, number, number] {
	hex = hex.replace('#', '');
	return [
		parseInt(hex.substring(0, 2), 16) / 255,
		parseInt(hex.substring(2, 4), 16) / 255,
		parseInt(hex.substring(4, 6), 16) / 255
	];
}

function linearize(c: number): number {
	return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function delinearize(c: number): number {
	return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1.0 / 2.4) - 0.055;
}

function rgbToOKLab(r: number, g: number, b: number): [number, number, number] {
	const lr = linearize(r);
	const lg = linearize(g);
	const lb = linearize(b);

	const l_ = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
	const m_ = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
	const s_ = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);

	return [
		0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
		1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
		0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
	];
}

function oklabToRGB(L: number, a: number, b: number): [number, number, number] {
	const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

	const l = l_ * l_ * l_;
	const m = m_ * m_ * m_;
	const s = s_ * s_ * s_;

	return [
		clamp01(delinearize(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
		clamp01(delinearize(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
		clamp01(delinearize(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s))
	];
}

export function hexToOKLCH(hex: string): OKLCH {
	const [r, g, b] = hexToRGB(hex);
	const [L, a, bVal] = rgbToOKLab(r, g, b);
	const c = Math.sqrt(a * a + bVal * bVal);
	let h = Math.atan2(bVal, a) * (180 / Math.PI);
	if (h < 0) h += 360;
	return { l: L, c, h };
}

export function oklchToHex(color: OKLCH): string {
	const hRad = color.h * (Math.PI / 180);
	const a = color.c * Math.cos(hRad);
	const b = color.c * Math.sin(hRad);
	const [r, g, bVal] = oklabToRGB(color.l, a, b);
	const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(bVal)}`;
}

/** Also keep hex↔HSL for backward compatibility */
export function hexToHSL(hex: string): HSL {
	const [r, g, b] = hexToRGB(hex);
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	let h = 0, s = 0;
	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
			case g: h = ((b - r) / d + 2) / 6; break;
			case b: h = ((r - g) / d + 4) / 6; break;
		}
	}
	return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(hsl: HSL): string {
	const h = hsl.h / 360, s = hsl.s / 100, l = hsl.l / 100;
	function hue2rgb(p: number, q: number, t: number): number {
		if (t < 0) t += 1; if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	}
	let r: number, g: number, b: number;
	if (s === 0) { r = g = b = l; }
	else {
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
	}
	const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ─── Palette generation ────────────────────────────────────────────────

/** Get contrasting content color for a given background */
function contrastContent(bg: OKLCH): OKLCH {
	return bg.l > 0.55
		? { l: 0.25, c: Math.min(bg.c, 0.04), h: bg.h }
		: { l: 0.95, c: Math.min(bg.c, 0.03), h: bg.h };
}

/** Generate a full light-mode palette from primary and accent hex colors */
export function generateLightPalette(primaryHex: string, accentHex: string): ThemePalette {
	const p = hexToOKLCH(primaryHex);
	const a = hexToOKLCH(accentHex);

	const primary: OKLCH = { l: clampVal(p.l, 0.35, 0.55), c: Math.min(p.c + 0.02, 0.3), h: p.h };
	const secondary: OKLCH = { l: clampVal(a.l, 0.45, 0.65), c: Math.min(a.c + 0.01, 0.25), h: a.h };
	const accent: OKLCH = { l: clampVal(a.l, 0.55, 0.75), c: Math.min(a.c, 0.2), h: a.h };
	const neutral: OKLCH = { l: 0.25, c: 0.015, h: p.h };

	const base100: OKLCH = { l: 0.98, c: 0.005, h: p.h };
	const base200: OKLCH = { l: 0.95, c: 0.008, h: p.h };
	const base300: OKLCH = { l: 0.90, c: 0.010, h: p.h };

	const info: OKLCH = { l: 0.70, c: 0.15, h: (p.h + 200) % 360 };
	const success: OKLCH = { l: 0.70, c: 0.17, h: 160 };
	const warning: OKLCH = { l: 0.80, c: 0.18, h: 85 };
	const error: OKLCH = { l: 0.65, c: 0.20, h: 25 };

	return {
		primary, primaryContent: contrastContent(primary),
		secondary, secondaryContent: contrastContent(secondary),
		accent, accentContent: contrastContent(accent),
		neutral, neutralContent: { l: 0.90, c: 0.005, h: p.h },
		base100, base200, base300, baseContent: { l: 0.25, c: 0.015, h: p.h },
		info, infoContent: contrastContent(info),
		success, successContent: contrastContent(success),
		warning, warningContent: contrastContent(warning),
		error, errorContent: contrastContent(error),
	};
}

/** Generate a full dark-mode palette from primary and accent hex colors */
export function generateDarkPalette(primaryHex: string, accentHex: string): ThemePalette {
	const p = hexToOKLCH(primaryHex);
	const a = hexToOKLCH(accentHex);

	const primary: OKLCH = { l: clampVal(p.l + 0.1, 0.50, 0.70), c: Math.min(p.c + 0.02, 0.28), h: p.h };
	const secondary: OKLCH = { l: clampVal(a.l, 0.55, 0.70), c: Math.min(a.c + 0.01, 0.22), h: a.h };
	const accent: OKLCH = { l: clampVal(a.l + 0.05, 0.60, 0.75), c: Math.min(a.c, 0.18), h: a.h };
	const neutral: OKLCH = { l: 0.20, c: 0.015, h: p.h };

	const base100: OKLCH = { l: 0.25, c: 0.015, h: p.h };
	const base200: OKLCH = { l: 0.22, c: 0.012, h: p.h };
	const base300: OKLCH = { l: 0.18, c: 0.010, h: p.h };

	const info: OKLCH = { l: 0.72, c: 0.14, h: (p.h + 200) % 360 };
	const success: OKLCH = { l: 0.72, c: 0.16, h: 160 };
	const warning: OKLCH = { l: 0.80, c: 0.17, h: 85 };
	const error: OKLCH = { l: 0.68, c: 0.19, h: 25 };

	return {
		primary, primaryContent: contrastContent(primary),
		secondary, secondaryContent: contrastContent(secondary),
		accent, accentContent: contrastContent(accent),
		neutral, neutralContent: { l: 0.88, c: 0.005, h: p.h },
		base100, base200, base300, baseContent: { l: 0.92, c: 0.010, h: p.h },
		info, infoContent: contrastContent(info),
		success, successContent: contrastContent(success),
		warning, warningContent: contrastContent(warning),
		error, errorContent: contrastContent(error),
	};
}

/** Convert a palette to DaisyUI v5 CSS variable overrides (oklch format) */
export function paletteToCSSVars(palette: ThemePalette): Record<string, string> {
	function oklchVal(c: OKLCH): string {
		return `oklch(${(c.l * 100).toFixed(1)}% ${c.c.toFixed(3)} ${c.h.toFixed(1)})`;
	}

	return {
		'--color-primary': oklchVal(palette.primary),
		'--color-primary-content': oklchVal(palette.primaryContent),
		'--color-secondary': oklchVal(palette.secondary),
		'--color-secondary-content': oklchVal(palette.secondaryContent),
		'--color-accent': oklchVal(palette.accent),
		'--color-accent-content': oklchVal(palette.accentContent),
		'--color-neutral': oklchVal(palette.neutral),
		'--color-neutral-content': oklchVal(palette.neutralContent),
		'--color-base-100': oklchVal(palette.base100),
		'--color-base-200': oklchVal(palette.base200),
		'--color-base-300': oklchVal(palette.base300),
		'--color-base-content': oklchVal(palette.baseContent),
		'--color-info': oklchVal(palette.info),
		'--color-info-content': oklchVal(palette.infoContent),
		'--color-success': oklchVal(palette.success),
		'--color-success-content': oklchVal(palette.successContent),
		'--color-warning': oklchVal(palette.warning),
		'--color-warning-content': oklchVal(palette.warningContent),
		'--color-error': oklchVal(palette.error),
		'--color-error-content': oklchVal(palette.errorContent),
	};
}

function clamp01(v: number): number { return Math.max(0, Math.min(1, v)); }
function clampVal(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}
