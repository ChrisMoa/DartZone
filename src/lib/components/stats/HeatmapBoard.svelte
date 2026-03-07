<script lang="ts">
	import { SECTOR_ORDER, RINGS, generateSectorPath } from '$lib/components/dartboard/dartboard.utils.js';

	interface Props {
		sectorCounts: Record<number, number>;
		size?: number;
	}

	let { sectorCounts, size = 300 }: Props = $props();

	const boardRadius = $derived(size / 2);
	const maxCount = $derived(Math.max(1, ...Object.values(sectorCounts)));

	function getHeatColor(sector: number): string {
		const count = sectorCounts[sector] ?? 0;
		if (count === 0) return 'rgba(100, 100, 100, 0.3)';
		const intensity = count / maxCount;
		// Gradient from cool blue to hot red
		const r = Math.round(255 * intensity);
		const g = Math.round(80 * (1 - intensity));
		const b = Math.round(255 * (1 - intensity));
		return `rgba(${r}, ${g}, ${b}, ${0.4 + intensity * 0.6})`;
	}

	function getBullHeatColor(): string {
		const count = sectorCounts[25] ?? 0;
		if (count === 0) return 'rgba(100, 100, 100, 0.3)';
		const intensity = count / maxCount;
		const r = Math.round(255 * intensity);
		const g = Math.round(80 * (1 - intensity));
		const b = Math.round(255 * (1 - intensity));
		return `rgba(${r}, ${g}, ${b}, ${0.4 + intensity * 0.6})`;
	}
</script>

<div class="flex flex-col items-center gap-2" data-testid="heatmap-board">
	<svg
		width={size}
		height={size}
		viewBox="-{boardRadius} -{boardRadius} {size} {size}"
		class="drop-shadow-md"
	>
		{#each SECTOR_ORDER as sector, i}
			{@const sectorValue = sector}
			<!-- Outer single -->
			<path
				d={generateSectorPath(i, RINGS.TRIPLE_OUTER, RINGS.DOUBLE_INNER, boardRadius)}
				fill={getHeatColor(sectorValue)}
				stroke="#333"
				stroke-width="0.5"
			/>
			<!-- Double -->
			<path
				d={generateSectorPath(i, RINGS.DOUBLE_INNER, RINGS.DOUBLE_OUTER, boardRadius)}
				fill={getHeatColor(sectorValue)}
				stroke="#333"
				stroke-width="0.5"
			/>
			<!-- Inner single -->
			<path
				d={generateSectorPath(i, RINGS.BULL_OUTER, RINGS.TRIPLE_INNER, boardRadius)}
				fill={getHeatColor(sectorValue)}
				stroke="#333"
				stroke-width="0.5"
			/>
			<!-- Triple -->
			<path
				d={generateSectorPath(i, RINGS.TRIPLE_INNER, RINGS.TRIPLE_OUTER, boardRadius)}
				fill={getHeatColor(sectorValue)}
				stroke="#333"
				stroke-width="0.5"
			/>
		{/each}

		<!-- Bull -->
		<circle
			r={RINGS.BULL_OUTER * boardRadius}
			fill={getBullHeatColor()}
			stroke="#333"
			stroke-width="0.5"
		/>
		<!-- Bullseye -->
		<circle
			r={RINGS.BULLSEYE_OUTER * boardRadius}
			fill={getBullHeatColor()}
			stroke="#333"
			stroke-width="0.5"
		/>

		<!-- Sector labels -->
		{#each SECTOR_ORDER as sector, i}
			{@const angle = (i * 18 - 90) * Math.PI / 180}
			{@const labelR = boardRadius * 1.08}
			<text
				x={labelR * Math.cos(angle)}
				y={labelR * Math.sin(angle)}
				text-anchor="middle"
				dominant-baseline="central"
				class="text-[10px] fill-base-content/70 font-medium"
			>
				{sector}
			</text>
		{/each}
	</svg>

	<!-- Legend -->
	<div class="flex items-center gap-2 text-xs text-base-content/60">
		<span>Wenig</span>
		<div class="flex h-3">
			{#each Array.from({ length: 5 }) as _, i}
				{@const intensity = (i + 1) / 5}
				<div
					class="w-6 h-3"
					style="background: rgba({Math.round(255 * intensity)}, {Math.round(80 * (1 - intensity))}, {Math.round(255 * (1 - intensity))}, {0.4 + intensity * 0.6})"
				></div>
			{/each}
		</div>
		<span>Viel</span>
	</div>
</div>
