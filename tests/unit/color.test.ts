import { describe, it, expect } from 'vitest';
import {
	hexToOKLCH,
	oklchToHex,
	hexToHSL,
	hslToHex,
	generateLightPalette,
	generateDarkPalette,
	paletteToCSSVars,
	COLOR_PRESETS
} from '$lib/utils/color.js';

describe('hexToOKLCH', () => {
	it('converts black to near-zero lightness', () => {
		const result = hexToOKLCH('#000000');
		expect(result.l).toBeCloseTo(0, 1);
		expect(result.c).toBeCloseTo(0, 2);
	});

	it('converts white to near-one lightness', () => {
		const result = hexToOKLCH('#ffffff');
		expect(result.l).toBeCloseTo(1, 1);
		expect(result.c).toBeCloseTo(0, 2);
	});

	it('converts a green hex to roughly correct hue', () => {
		const result = hexToOKLCH('#2d6a4f');
		expect(result.l).toBeGreaterThan(0.3);
		expect(result.l).toBeLessThan(0.6);
		expect(result.c).toBeGreaterThan(0);
		expect(result.h).toBeGreaterThan(100);
		expect(result.h).toBeLessThan(200);
	});
});

describe('oklchToHex roundtrip', () => {
	it('roundtrips forest green preset', () => {
		const original = '#2d6a4f';
		const oklch = hexToOKLCH(original);
		const back = oklchToHex(oklch);
		// Allow small rounding differences
		const origR = parseInt(original.substring(1, 3), 16);
		const backR = parseInt(back.substring(1, 3), 16);
		expect(Math.abs(origR - backR)).toBeLessThanOrEqual(2);
	});

	it('roundtrips pure red', () => {
		const oklch = hexToOKLCH('#ff0000');
		const back = oklchToHex(oklch);
		const r = parseInt(back.substring(1, 3), 16);
		expect(r).toBeGreaterThan(250);
	});
});

describe('hexToHSL and hslToHex', () => {
	it('roundtrips correctly', () => {
		const hex = '#3a86a8';
		const hsl = hexToHSL(hex);
		const back = hslToHex(hsl);
		const origR = parseInt(hex.substring(1, 3), 16);
		const backR = parseInt(back.substring(1, 3), 16);
		expect(Math.abs(origR - backR)).toBeLessThanOrEqual(2);
	});
});

describe('generateLightPalette', () => {
	it('returns all expected palette keys', () => {
		const palette = generateLightPalette('#2d6a4f', '#95d5b2');
		expect(palette.primary).toBeDefined();
		expect(palette.base100).toBeDefined();
		expect(palette.error).toBeDefined();
	});

	it('has light base colors (high lightness)', () => {
		const palette = generateLightPalette('#2d6a4f', '#95d5b2');
		expect(palette.base100.l).toBeGreaterThan(0.9);
		expect(palette.base200.l).toBeGreaterThan(0.85);
	});

	it('has dark content color for base', () => {
		const palette = generateLightPalette('#2d6a4f', '#95d5b2');
		expect(palette.baseContent.l).toBeLessThan(0.4);
	});
});

describe('generateDarkPalette', () => {
	it('has dark base colors (low lightness)', () => {
		const palette = generateDarkPalette('#2d6a4f', '#95d5b2');
		expect(palette.base100.l).toBeLessThan(0.35);
		expect(palette.base200.l).toBeLessThan(0.3);
	});

	it('has light content color for base', () => {
		const palette = generateDarkPalette('#2d6a4f', '#95d5b2');
		expect(palette.baseContent.l).toBeGreaterThan(0.8);
	});
});

describe('paletteToCSSVars', () => {
	it('generates oklch CSS variable strings', () => {
		const palette = generateLightPalette('#2d6a4f', '#95d5b2');
		const vars = paletteToCSSVars(palette);

		expect(vars['--color-primary']).toMatch(/^oklch\(/);
		expect(vars['--color-base-100']).toMatch(/^oklch\(/);
		expect(vars['--color-error']).toMatch(/^oklch\(/);
		expect(Object.keys(vars)).toHaveLength(20);
	});
});

describe('COLOR_PRESETS', () => {
	it('has at least 4 presets', () => {
		expect(COLOR_PRESETS.length).toBeGreaterThanOrEqual(4);
	});

	it('all presets have valid hex colors', () => {
		for (const preset of COLOR_PRESETS) {
			expect(preset.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
			expect(preset.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
			expect(preset.name).toBeTruthy();
			expect(preset.label).toBeTruthy();
		}
	});

	it('all presets generate valid palettes', () => {
		for (const preset of COLOR_PRESETS) {
			const light = generateLightPalette(preset.primary, preset.accent);
			const dark = generateDarkPalette(preset.primary, preset.accent);
			const lightVars = paletteToCSSVars(light);
			const darkVars = paletteToCSSVars(dark);
			expect(Object.keys(lightVars)).toHaveLength(20);
			expect(Object.keys(darkVars)).toHaveLength(20);
		}
	});
});
