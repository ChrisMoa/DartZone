<script lang="ts">
	interface HitMarker {
		x: number;
		y: number;
		id: string;
	}

	interface Props {
		markers?: HitMarker[];
	}

	let { markers = [] }: Props = $props();
</script>

{#each markers as marker (marker.id)}
	<circle
		cx={marker.x}
		cy={marker.y}
		r="3"
		fill="red"
		stroke="white"
		stroke-width="1"
		class="hit-marker"
	/>
{/each}

<style>
	.hit-marker {
		filter: drop-shadow(0 0 2px rgba(255, 0, 0, 0.8));
	}
</style>
