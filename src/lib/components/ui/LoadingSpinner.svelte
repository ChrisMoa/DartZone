<script lang="ts">
	interface Props {
		size?: 'sm' | 'md' | 'lg';
	}

	let { size = 'md' }: Props = $props();

	const sizeClass = {
		sm: 'loading-sm',
		md: 'loading-md',
		lg: 'loading-lg'
	};
</script>

<span class="loading loading-spinner {sizeClass[size]}" data-testid="loading-spinner"></span>
