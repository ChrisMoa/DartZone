<script lang="ts">
	interface MatchAverage {
		match_id: string;
		label: string;
		average: number;
	}

	interface Props {
		data: MatchAverage[];
		height?: number;
	}

	let { data, height = 200 }: Props = $props();

	const maxAvg = $derived(Math.max(60, ...data.map((d) => d.average)));
	const chartWidth = $derived(Math.max(300, data.length * 60));
	const barWidth = $derived(Math.min(40, (chartWidth / Math.max(data.length, 1)) * 0.6));
	const gap = $derived(chartWidth / Math.max(data.length, 1));
</script>

<div class="card bg-base-100 shadow-sm" data-testid="average-chart">
	<div class="card-body">
		<h3 class="card-title text-sm">Durchschnitt pro Spiel</h3>

		{#if data.length === 0}
			<p class="text-sm text-base-content/60">Keine Daten vorhanden.</p>
		{:else}
			<div class="overflow-x-auto">
				<svg width={chartWidth} height={height + 40} class="block">
					<!-- Y-axis gridlines -->
					{#each [0, 0.25, 0.5, 0.75, 1] as fraction}
						{@const y = height - fraction * height}
						<line
							x1="0"
							y1={y}
							x2={chartWidth}
							y2={y}
							stroke="currentColor"
							stroke-opacity="0.1"
							stroke-dasharray="4"
						/>
						<text
							x="-4"
							y={y}
							text-anchor="end"
							dominant-baseline="central"
							class="text-[9px] fill-base-content/40"
						>
							{(maxAvg * fraction).toFixed(0)}
						</text>
					{/each}

					<!-- Bars -->
					{#each data as item, i}
						{@const barHeight = (item.average / maxAvg) * height}
						{@const x = i * gap + (gap - barWidth) / 2}
						{@const y = height - barHeight}
						<rect
							{x}
							{y}
							width={barWidth}
							height={barHeight}
							rx="3"
							class="fill-primary/80"
							data-testid="average-chart-bar"
						/>
						<text
							x={x + barWidth / 2}
							y={y - 4}
							text-anchor="middle"
							class="text-[10px] fill-base-content/70 font-medium"
						>
							{item.average.toFixed(1)}
						</text>
						<text
							x={x + barWidth / 2}
							y={height + 14}
							text-anchor="middle"
							class="text-[9px] fill-base-content/50"
						>
							{item.label}
						</text>
					{/each}
				</svg>
			</div>
		{/if}
	</div>
</div>
