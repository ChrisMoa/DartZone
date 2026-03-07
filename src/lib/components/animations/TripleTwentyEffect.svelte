<script lang="ts">
	import { gsap } from 'gsap';

	interface Props {
		ondone?: () => void;
	}

	let { ondone }: Props = $props();

	let container: HTMLElement;
	let textEl: HTMLElement;
	let streakEl: HTMLElement;

	function play() {
		const tl = gsap.timeline({
			onComplete: () => ondone?.()
		});

		// Fire streak across the screen
		tl.fromTo(
			streakEl,
			{ x: '-100%', opacity: 0.8, scaleX: 0.5 },
			{ x: '100vw', opacity: 0, scaleX: 2, duration: 0.6, ease: 'power2.in' }
		);

		// Text pop
		tl.fromTo(
			textEl,
			{ scale: 0, rotation: -15 },
			{ scale: 1.2, rotation: 0, duration: 0.3, ease: 'back.out(2)' },
			0.1
		).to(textEl, {
			scale: 1,
			opacity: 0,
			duration: 0.5,
			delay: 0.3,
			ease: 'power1.in'
		});
	}

	$effect(() => {
		play();
	});
</script>

<div
	bind:this={container}
	class="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
	data-testid="triple-twenty-effect"
>
	<div
		bind:this={streakEl}
		class="absolute h-2 w-48 top-1/2"
		style="background: linear-gradient(90deg, transparent, #ff6600, #ff3300, transparent); filter: blur(2px);"
	></div>
	<div
		bind:this={textEl}
		class="text-4xl font-black"
		style="color: #ff6600; text-shadow: 0 0 20px rgba(255,102,0,0.5);"
	>
		T20!
	</div>
</div>
