#!/usr/bin/env node
// Tournament simulator for DartZone — drives a knockout tournament round by
// round so the spectator beamer views can be rehearsed end-to-end.
//
// Usage:
//   node scripts/sim-tournament.mjs                # auto-pick latest knockout
//   node scripts/sim-tournament.mjs <tournament-id>
//
// Env knobs (override with `KEY=value node scripts/sim-tournament.mjs`):
//   SIM_HOST            target host (default: http://localhost:3000)
//   SIM_PARALLELISM     concurrent matches per round chunk (default: 4)
//   SIM_ROUND_PAUSE     seconds to pause before each non-first round (default: 60)
//   SIM_LEG_DELAY       seconds between leg completions per match (default: 6)
//   SIM_TURN_DELAY      seconds between live-state pushes during a leg (default: 2)
//   SIM_TURNS_PER_LEG   simulated turns per leg before completion (default: 8)

import process from 'node:process';

const HOST = (process.env.SIM_HOST ?? 'http://localhost:3000').replace(/\/$/, '');
const PARALLELISM = Number(process.env.SIM_PARALLELISM ?? 4);
const ROUND_PAUSE_S = Number(process.env.SIM_ROUND_PAUSE ?? 60);
const LEG_DELAY_S = Number(process.env.SIM_LEG_DELAY ?? 6);
const TURN_DELAY_S = Number(process.env.SIM_TURN_DELAY ?? 2);
const TURNS_PER_LEG = Number(process.env.SIM_TURNS_PER_LEG ?? 8);

const ROUND_ORDER = ['Runde 1', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...args) => console.log(`[${new Date().toLocaleTimeString('de-DE')}]`, ...args);
const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

async function fetchJson(path, init = {}) {
	const res = await fetch(`${HOST}${path}`, init);
	if (!res.ok) {
		const body = await res.text().catch(() => '');
		throw new Error(`${init.method ?? 'GET'} ${path} → ${res.status}: ${body.slice(0, 200)}`);
	}
	return res.json();
}

async function listTournaments() {
	return fetchJson('/api/tournaments');
}

async function getTournamentLive(tid) {
	return fetchJson(`/api/tournaments/${tid}/live`);
}

async function callFormAction(tid, mid, action, fields = {}) {
	// SvelteKit form action: POST with ?/<action> + multipart body + the
	// x-sveltekit-action header so we get a JSON response we can parse.
	const fd = new FormData();
	for (const [k, v] of Object.entries(fields)) fd.set(k, v);
	const res = await fetch(`${HOST}/tournaments/${tid}/matches/${mid}/play?/${action}`, {
		method: 'POST',
		headers: { 'x-sveltekit-action': 'true' },
		body: fd
	});
	const body = await res.text();
	if (!res.ok) throw new Error(`form action ${action} on ${mid} → ${res.status}: ${body.slice(0, 200)}`);
	try {
		const parsed = JSON.parse(body);
		if (parsed?.type === 'failure' || parsed?.type === 'error') {
			throw new Error(`form action ${action} on ${mid} returned ${parsed.type}: ${body.slice(0, 200)}`);
		}
		return parsed;
	} catch (err) {
		// Some actions return non-JSON; that's fine for our purposes
		return { rawBody: body };
	}
}

async function pushLiveState(mid, payload) {
	await fetch(`${HOST}/api/matches/${mid}/live`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(payload)
	}).catch((err) => log(`pushLiveState failed for ${mid}:`, err.message));
}

function pickLatestKnockout(tournaments) {
	const knockout = tournaments.filter((t) => t.format === 'knockout');
	if (knockout.length === 0) return null;
	// Prefer running > planned > finished. Within each, pick by start_date desc, then by name.
	const statusRank = { running: 0, planned: 1, finished: 2, aborted: 3 };
	knockout.sort((a, b) => {
		const sa = statusRank[a.status] ?? 9;
		const sb = statusRank[b.status] ?? 9;
		if (sa !== sb) return sa - sb;
		const da = a.start_date ?? '';
		const db = b.start_date ?? '';
		if (da !== db) return db.localeCompare(da);
		return a.name.localeCompare(b.name);
	});
	return knockout[0];
}

function pickRound(matches) {
	const open = matches.filter((m) => m.status !== 'completed');
	for (const r of ROUND_ORDER) {
		if (open.some((m) => m.round === r)) return r;
	}
	if (open.length > 0) return open[0].round ?? '(unbenannt)';
	return null;
}

function startingScore(gameMode) {
	if (gameMode === '301') return 301;
	if (gameMode === 'cricket') return 0;
	return 501;
}

async function simulateLeg(tournament, match, legNumber, startingPlayerSide) {
	// Push a sequence of live-state updates so the spectator view shows movement
	// during the leg. We don't persist throws (only legs).
	const start = startingScore(tournament.game_mode);
	let homeRem = start;
	let awayRem = start;
	let active = startingPlayerSide; // 'home' | 'away'
	let dart = 1;
	const homeName = match.home_club.short_name ?? 'Heim';
	const awayName = match.away_club.short_name ?? 'Gast';

	const pushState = (extra = {}) => {
		const payload = {
			leg_number: legNumber,
			home_player_name: homeName,
			away_player_name: awayName,
			home_remaining: homeRem,
			away_remaining: awayRem,
			home_average: 60,
			away_average: 60,
			current_player_side: active,
			current_dart: dart,
			current_turn_throws: [],
			last_throw_score: null,
			status: 'in_progress',
			game_mode: tournament.game_mode,
			...extra
		};
		return pushLiveState(match.id, payload);
	};

	await pushState();
	for (let t = 0; t < TURNS_PER_LEG; t++) {
		await sleep(TURN_DELAY_S * 1000);
		const score = rand(20, 100);
		if (active === 'home') homeRem = Math.max(2, homeRem - score);
		else awayRem = Math.max(2, awayRem - score);
		dart = ((dart % 3) + 1);
		if (dart === 1) active = active === 'home' ? 'away' : 'home';
		await pushState();
	}
}

async function playMatch(tournament, matchInitial) {
	const tid = tournament.id;
	const mid = matchInitial.id;
	const label = `${matchInitial.home_club.short_name ?? '?'} vs ${matchInitial.away_club.short_name ?? '?'} (${matchInitial.round ?? '?'})`;

	log(`▶ Starting ${label}`);

	// 1. Mark in_progress (idempotent)
	if (matchInitial.status !== 'in_progress') {
		try {
			await callFormAction(tid, mid, 'startGame');
		} catch (err) {
			log(`  ⚠ startGame on ${mid}: ${err.message}`);
		}
	}

	const legsToWin = Math.ceil(tournament.sets_per_match / 2);
	let homeLegs = matchInitial.home_legs_won;
	let awayLegs = matchInitial.away_legs_won;
	let legNumber = homeLegs + awayLegs + 1;
	let startingPlayer = legNumber % 2 === 1 ? 'home' : 'away';

	while (homeLegs < legsToWin && awayLegs < legsToWin) {
		await simulateLeg(tournament, matchInitial, legNumber, startingPlayer);

		const winnerSide = Math.random() < 0.5 ? 'home' : 'away';
		try {
			await callFormAction(tid, mid, 'completeLeg', { winner_side: winnerSide });
		} catch (err) {
			log(`  ⚠ completeLeg on ${mid}: ${err.message}`);
			break;
		}
		if (winnerSide === 'home') homeLegs++;
		else awayLegs++;
		log(`  ${label} leg ${legNumber} → ${winnerSide} wins (${homeLegs}:${awayLegs})`);
		legNumber++;
		startingPlayer = startingPlayer === 'home' ? 'away' : 'home';
		await sleep(LEG_DELAY_S * 1000);
	}

	log(`✔ Finished ${label}: ${homeLegs}:${awayLegs}`);
}

async function chunkParallel(items, limit, fn) {
	for (let i = 0; i < items.length; i += limit) {
		const chunk = items.slice(i, i + limit);
		await Promise.all(chunk.map(fn));
	}
}

async function main() {
	const overrideId = process.argv[2];

	let tournament;
	if (overrideId) {
		const live = await getTournamentLive(overrideId);
		tournament = live.tournament;
	} else {
		log(`Fetching tournament list from ${HOST}…`);
		const tournaments = await listTournaments();
		const pick = pickLatestKnockout(tournaments);
		if (!pick) {
			log('No knockout tournament found. Pass an ID as argument.');
			process.exit(1);
		}
		tournament = pick;
	}

	log(`Tournament: ${tournament.name} (${tournament.id}) — ${tournament.game_mode} · ${tournament.format} · best of ${tournament.sets_per_match}`);
	log(
		`Settings: parallelism=${PARALLELISM}, round-pause=${ROUND_PAUSE_S}s, leg-delay=${LEG_DELAY_S}s, turn-delay=${TURN_DELAY_S}s, turns/leg=${TURNS_PER_LEG}`
	);

	let firstRound = true;
	while (true) {
		const live = await getTournamentLive(tournament.id);
		const open = live.matches.filter((m) => m.status !== 'completed');
		if (open.length === 0) {
			log('🏁 All matches completed. Done.');
			break;
		}

		const round = pickRound(live.matches);
		const toPlay = open.filter((m) => m.round === round);
		const skipped = live.matches.filter(
			(m) => m.round === round && m.status === 'completed'
		).length;

		if (!firstRound) {
			log(
				`⏸  Pausing ${ROUND_PAUSE_S}s before "${round}" so you can adjust the tile layout (Ctrl+C to abort)…`
			);
			await sleep(ROUND_PAUSE_S * 1000);
		}
		firstRound = false;

		log(
			`🎯 Playing "${round}": ${toPlay.length} match${toPlay.length === 1 ? '' : 'es'}` +
				(skipped > 0 ? ` (${skipped} already completed, skipped)` : '')
		);
		for (const m of toPlay) {
			log(`   • ${m.home_club.short_name ?? '?'} vs ${m.away_club.short_name ?? '?'} [${m.status}]`);
		}

		await chunkParallel(toPlay, PARALLELISM, (m) => playMatch(tournament, m));

		log(`✅ "${round}" complete. Re-checking match list (next round may have been generated)…`);
		await sleep(2_000);
	}
}

main().catch((err) => {
	console.error('Simulator failed:', err);
	process.exit(1);
});
