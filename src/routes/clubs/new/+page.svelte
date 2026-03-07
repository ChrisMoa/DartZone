<script lang="ts">
	import ClubForm from '$lib/components/clubs/ClubForm.svelte';

	let { form } = $props();
</script>

<div class="mx-auto max-w-lg">
	<ClubForm errors={form?.errors} />
</div>
