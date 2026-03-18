<script lang="ts">
	import type { Multiplier, SectorValue } from '$lib/types/game.js';

	interface Props {
		path: string;
		sector: SectorValue;
		multiplier: Multiplier;
		fill: string;
		disabled?: boolean;
		dimmed?: boolean;
		onhit?: (event: { sector: SectorValue; multiplier: Multiplier; score: number }) => void;
	}

	let { path, sector, multiplier, fill, disabled = false, dimmed = false, onhit }: Props = $props();

	let hovered = $state(false);

	function handleClick() {
		if (disabled) return;
		onhit?.({ sector, multiplier, score: sector * multiplier });
	}

	const hoverFill = $derived(hovered && !disabled ? 'rgba(255, 255, 255, 0.2)' : 'transparent');

	const sectorLabel = $derived.by(() => {
		if (sector === 0) return 'Miss';
		const ring = multiplier === 3 ? 'Triple' : multiplier === 2 ? 'Double' : 'Single';
		const name = sector === 25 ? 'Bull' : String(sector);
		return `${ring} ${name} (${sector * multiplier})`;
	});
</script>

<g
	role="button"
	tabindex="0"
	aria-label={sectorLabel}
	class="dartboard-sector"
	class:disabled
	class:dimmed
	onclick={handleClick}
	onkeydown={(e) => e.key === 'Enter' && handleClick()}
	onmouseenter={() => (hovered = true)}
	onmouseleave={() => (hovered = false)}
	data-sector={sector}
	data-multiplier={multiplier}
>
	<path d={path} {fill} stroke="#808080" stroke-width="0.5" />
	<path d={path} fill={hoverFill} stroke="none" />
</g>

<style>
	.dartboard-sector {
		cursor: pointer;
		outline: none;
		transition: filter 0.15s ease;
	}
	.dartboard-sector:focus-visible {
		filter: brightness(1.5);
		outline: 2px solid currentColor;
		outline-offset: -2px;
	}
	.dartboard-sector:hover:not(.disabled) {
		filter: brightness(1.3);
	}
	.dartboard-sector:active:not(.disabled) {
		filter: brightness(0.9);
	}
	.dartboard-sector.disabled {
		cursor: default;
		pointer-events: none;
	}
	.dartboard-sector.dimmed {
		opacity: 0.35;
	}
</style>
