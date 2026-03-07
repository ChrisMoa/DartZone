<script lang="ts">
	import { gsap } from 'gsap';
	import { createParticles, animateParticleBurst, cleanupParticles } from './animation.utils.js';

	interface Props {
		ondone?: () => void;
	}

	let { ondone }: Props = $props();

	let container: HTMLElement;
	let pulseRing: HTMLElement;

	function play() {
		const tl = gsap.timeline({
			onComplete: () => {
				cleanupParticles(particles);
				ondone?.();
			}
		});

		// Radial pulse from center
		tl.fromTo(
			pulseRing,
			{ scale: 0, opacity: 1 },
			{ scale: 3, opacity: 0, duration: 0.6, ease: 'power2.out' }
		);

		// Particle burst
		const particles = createParticles(container, 20, ['#e74c3c', '#c0392b', '#ff6b6b', '#ffd700']);
		const burstTl = animateParticleBurst(particles, 150);
		tl.add(burstTl, 0.1);
	}

	$effect(() => {
		play();
	});
</script>

<div
	bind:this={container}
	class="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
	data-testid="bullseye-effect"
>
	<div
		bind:this={pulseRing}
		class="w-24 h-24 rounded-full border-4 border-error absolute"
		style="transform-origin: center;"
	></div>
	<div class="text-4xl font-black text-error animate-bounce">BULLSEYE!</div>
</div>
