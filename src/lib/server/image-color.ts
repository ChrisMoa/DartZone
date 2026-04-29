import { Jimp } from 'jimp';

/**
 * Extract the dominant accent color from a crest image buffer.
 *
 * Uses a coarse 16-bin-per-channel histogram, ignores near-white,
 * near-black, near-grey and transparent pixels, and returns the bucket
 * with the most votes — averaged over the actual member pixels for
 * better fidelity than the bucket centre.
 *
 * Returns null for unsupported formats (e.g. SVG) so the caller can
 * keep the existing color.
 */
export async function extractDominantColor(buffer: Buffer, mime: string): Promise<string | null> {
	if (mime === 'image/svg+xml') return null;

	let image;
	try {
		image = await Jimp.read(buffer);
	} catch {
		return null;
	}

	// Down-sample for speed; 64x64 is plenty for a dominant-color vote.
	if (image.bitmap.width > 64 || image.bitmap.height > 64) {
		image.resize({ w: 64, h: 64 });
	}

	const buckets = new Map<number, { count: number; r: number; g: number; b: number }>();
	const data = image.bitmap.data;

	for (let i = 0; i < data.length; i += 4) {
		const r = data[i];
		const g = data[i + 1];
		const b = data[i + 2];
		const a = data[i + 3];

		if (a < 128) continue;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		if (max > 240 && min > 220) continue;
		if (max < 30) continue;
		if (max - min < 18) continue;

		const key = (r >> 4) * 256 + (g >> 4) * 16 + (b >> 4);
		const bucket = buckets.get(key);
		if (bucket) {
			bucket.count++;
			bucket.r += r;
			bucket.g += g;
			bucket.b += b;
		} else {
			buckets.set(key, { count: 1, r, g, b });
		}
	}

	if (buckets.size === 0) return null;

	let best: { count: number; r: number; g: number; b: number } | null = null;
	for (const bucket of buckets.values()) {
		if (!best || bucket.count > best.count) best = bucket;
	}
	if (!best) return null;

	const r = Math.round(best.r / best.count);
	const g = Math.round(best.g / best.count);
	const b = Math.round(best.b / best.count);

	const hex = (n: number) => n.toString(16).padStart(2, '0');
	return `#${hex(r)}${hex(g)}${hex(b)}`;
}
