#!/usr/bin/env node
/**
 * Re-assign primary_color for every club using a hue-spread palette,
 * so the placeholder shields are visually distinct on the dashboard
 * until real wappen are uploaded.
 *
 * Usage:  node scripts/recolor-clubs.mjs
 */
import Database from 'better-sqlite3';

const DB_PATH = process.env.DARTZONE_DB_PATH ?? 'data/dartzone.db';

// HSL → hex, deterministic spread across the hue wheel.
function hslToHex(h, s, l) {
	s /= 100; l /= 100;
	const k = (n) => (n + h / 30) % 12;
	const a = s * Math.min(l, 1 - l);
	const f = (n) => {
		const v = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
		return Math.round(255 * v).toString(16).padStart(2, '0');
	};
	return `#${f(0)}${f(8)}${f(4)}`;
}

const db = new Database(DB_PATH);
const clubs = db.prepare('SELECT id, name FROM clubs ORDER BY name').all();
const update = db.prepare('UPDATE clubs SET primary_color = ?, secondary_color = ?, updated_at = ? WHERE id = ?');

const now = new Date().toISOString();
const tx = db.transaction(() => {
	clubs.forEach((club, i) => {
		// 20 teams → step 18° around the wheel; alternate lightness so
		// neighbouring teams differ in tone, not just hue.
		const hue = (i * 360) / clubs.length;
		const lightness = i % 2 === 0 ? 45 : 38;
		const primary = hslToHex(hue, 70, lightness);
		const secondary = hslToHex((hue + 30) % 360, 55, 75);
		update.run(primary, secondary, now, club.id);
		console.log(`${club.name.padEnd(22)}  primary=${primary}  secondary=${secondary}`);
	});
});
tx();

console.log(`\n✓ Recolored ${clubs.length} clubs in ${DB_PATH}`);
db.close();
