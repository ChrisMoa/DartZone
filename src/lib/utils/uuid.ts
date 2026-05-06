/**
 * crypto.randomUUID() requires a secure context (HTTPS or localhost). On plain
 * HTTP origins (e.g. LAN deployments) it is undefined. This helper falls back
 * to a Math.random-based UUID v4 — fine for client-side IDs that don't need
 * cryptographic guarantees.
 */
export function safeRandomUUID(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID();
	}
	// RFC4122 v4 fallback
	const rnd = (): number => {
		if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
			const buf = new Uint8Array(1);
			crypto.getRandomValues(buf);
			return buf[0] / 256;
		}
		return Math.random();
	};
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (rnd() * 16) | 0;
		const v = c === 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}
