<script lang="ts">
	import type { Multiplier, SectorValue } from '$lib/types/game.js';
	import DartboardSector from './DartboardSector.svelte';
	import DartboardOverlay from './DartboardOverlay.svelte';
	import {
		SECTOR_ORDER,
		RINGS,
		generateSectorPath
	} from './dartboard.utils.js';

	interface HitEvent {
		sector: SectorValue;
		multiplier: Multiplier;
		score: number;
	}

	interface HitMarker {
		x: number;
		y: number;
		id: string;
	}

	export type Quadrant = 'full' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

	interface Props {
		size?: number;
		disabled?: boolean;
		markers?: HitMarker[];
		quadrant?: Quadrant;
		highlightSegments?: number[];
		onhit?: (event: HitEvent) => void;
	}

	let { size = 400, disabled = false, markers = [], quadrant = 'full', highlightSegments = [], onhit }: Props = $props();

	const dimmedSegments = $derived(highlightSegments.length > 0);

	const boardRadius = $derived(size / 2);

	// Quadrant viewBox: show a quarter of the board with overlap so the bull is always visible
	// LABEL_PAD accounts for number labels placed outside the board ring
	const OVERLAP = 0.18;
	const LABEL_PAD = 0.15;
	const viewBox = $derived.by(() => {
		const R = boardRadius;
		const pad = R * OVERLAP;
		const lp = R * LABEL_PAD;
		switch (quadrant) {
			case 'top-left':
				return `${-R - lp} ${-R - lp} ${R + pad + lp} ${R + pad + lp}`;
			case 'top-right':
				return `${-pad} ${-R - lp} ${R + pad + lp} ${R + pad + lp}`;
			case 'bottom-left':
				return `${-R - lp} ${-pad} ${R + pad + lp} ${R + pad + lp}`;
			case 'bottom-right':
				return `${-pad} ${-pad} ${R + pad + lp} ${R + pad + lp}`;
			default:
				return `${-R - lp} ${-R - lp} ${size + lp * 2} ${size + lp * 2}`;
		}
	});

	// Color scheme for the dartboard
	const COLORS = {
		black: '#1a1a1a',
		white: '#f5f0e1',
		red: '#e74c3c',
		green: '#27ae60'
	} as const;

	function getSectorColor(sectorIndex: number, ring: 'single_inner' | 'single_outer' | 'double' | 'triple'): string {
		const isEven = sectorIndex % 2 === 0;
		switch (ring) {
			case 'double':
			case 'triple':
				return isEven ? COLORS.red : COLORS.green;
			case 'single_inner':
			case 'single_outer':
				return isEven ? COLORS.black : COLORS.white;
		}
	}

	interface SectorData {
		path: string;
		sector: SectorValue;
		multiplier: Multiplier;
		fill: string;
	}

	const sectors = $derived.by((): SectorData[] => {
		const result: SectorData[] = [];
		const r = boardRadius;

		for (let i = 0; i < 20; i++) {
			const sectorNum = SECTOR_ORDER[i] as SectorValue;

			// Double ring (outermost)
			result.push({
				path: generateSectorPath(i, RINGS.DOUBLE_INNER, RINGS.DOUBLE_OUTER, r),
				sector: sectorNum,
				multiplier: 2,
				fill: getSectorColor(i, 'double')
			});

			// Outer single
			result.push({
				path: generateSectorPath(i, RINGS.TRIPLE_OUTER, RINGS.DOUBLE_INNER, r),
				sector: sectorNum,
				multiplier: 1,
				fill: getSectorColor(i, 'single_outer')
			});

			// Triple ring
			result.push({
				path: generateSectorPath(i, RINGS.TRIPLE_INNER, RINGS.TRIPLE_OUTER, r),
				sector: sectorNum,
				multiplier: 3,
				fill: getSectorColor(i, 'triple')
			});

			// Inner single
			result.push({
				path: generateSectorPath(i, RINGS.BULL_OUTER, RINGS.TRIPLE_INNER, r),
				sector: sectorNum,
				multiplier: 1,
				fill: getSectorColor(i, 'single_inner')
			});
		}

		return result;
	});

	// Bull and Bullseye circles
	const bullRadius = $derived(RINGS.BULL_OUTER * boardRadius);
	const bullseyeRadius = $derived(RINGS.BULLSEYE_OUTER * boardRadius);

	function handleHit(event: HitEvent) {
		if (!disabled) {
			onhit?.(event);
		}
	}
</script>

<svg
	width={size}
	height={size}
	viewBox={viewBox}
	class="dartboard"
	data-testid="dartboard"
	role="group"
	aria-label="Dartboard"
>
	<!-- Background circle -->
	<circle cx="0" cy="0" r={boardRadius} fill="#2c2c2c" />

	<!-- Sector segments -->
	{#each sectors as sector (sector.path)}
		<DartboardSector
			path={sector.path}
			sector={sector.sector}
			multiplier={sector.multiplier}
			fill={sector.fill}
			{disabled}
			dimmed={dimmedSegments && !highlightSegments.includes(sector.sector)}
			onhit={handleHit}
		/>
	{/each}

	<!-- Bull (single bull - green) -->
	<circle
		cx="0"
		cy="0"
		r={bullRadius}
		fill={COLORS.green}
		stroke="#808080"
		stroke-width="0.5"
		role="button"
		tabindex="0"
		aria-label="Single Bull (25)"
		data-sector="25"
		data-multiplier="1"
		class="dartboard-sector"
		class:disabled
		onclick={() => handleHit({ sector: 25, multiplier: 1, score: 25 })}
		onkeydown={(e) => e.key === 'Enter' && handleHit({ sector: 25, multiplier: 1, score: 25 })}
	/>

	<!-- Bullseye (double bull - red) -->
	<circle
		cx="0"
		cy="0"
		r={bullseyeRadius}
		fill={COLORS.red}
		stroke="#808080"
		stroke-width="0.5"
		role="button"
		tabindex="0"
		aria-label="Double Bull (50)"
		data-sector="25"
		data-multiplier="2"
		class="dartboard-sector"
		class:disabled
		onclick={() => handleHit({ sector: 25, multiplier: 2, score: 50 })}
		onkeydown={(e) => e.key === 'Enter' && handleHit({ sector: 25, multiplier: 2, score: 50 })}
	/>

	<!-- Number labels -->
	{#each SECTOR_ORDER as num, i}
		{@const angle = ((i * 18 - 90) * Math.PI) / 180}
		{@const labelRadius = boardRadius * 1.08}
		{@const lx = labelRadius * Math.cos(angle)}
		{@const ly = labelRadius * Math.sin(angle)}
		<!-- Text outline for readability -->
		<text
			x={lx}
			y={ly}
			text-anchor="middle"
			dominant-baseline="central"
			fill="none"
			stroke="#000"
			stroke-width={boardRadius * 0.015}
			font-size={boardRadius * 0.09}
			font-weight="bold"
			font-family="Arial, sans-serif"
		>
			{num}
		</text>
		<text
			x={lx}
			y={ly}
			text-anchor="middle"
			dominant-baseline="central"
			fill="white"
			font-size={boardRadius * 0.09}
			font-weight="bold"
			font-family="Arial, sans-serif"
		>
			{num}
		</text>
	{/each}

	<!-- Hit markers overlay -->
	<DartboardOverlay {markers} />
</svg>

<style>
	.dartboard {
		user-select: none;
		-webkit-user-select: none;
		transition: all 0.3s ease;
	}
	.dartboard-sector {
		cursor: pointer;
		outline: none;
	}
	.dartboard-sector.disabled {
		cursor: default;
		pointer-events: none;
	}
</style>
