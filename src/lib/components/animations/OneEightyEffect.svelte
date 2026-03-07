<script lang="ts">
	import { gsap } from 'gsap';
	import { createParticles, animateParticleBurst, cleanupParticles } from './animation.utils.js';

	interface Props {
		ondone?: () => void;
	}

	let { ondone }: Props = $props();

	let container: HTMLElement;
	let backdrop: HTMLElement;
	let textEl: HTMLElement;

	function play() {
		const particles = createParticles(container, 40, [
			'#ffd700', '#ffaa00', '#ff8800', '#fff176', '#ffffff'
		]);

		const tl = gsap.timeline({
			onComplete: () => {
				cleanupParticles(particles);
				ondone?.();
			}
		});

		// Golden backdrop flash
		tl.fromTo(
			backdrop,
			{ opacity: 0 },
			{ opacity: 0.4, duration: 0.2, ease: 'power2.out' }
		);

		// Big "180!" text entrance
		tl.fromTo(
			textEl,
			{ scale: 0, rotation: -30, opacity: 0 },
			{ scale: 1, rotation: 0, opacity: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' },
			0.1
		);

		// Particle burst
		const burstTl = animateParticleBurst(particles, 250);
		tl.add(burstTl, 0.2);

		// Fade out
		tl.to(backdrop, { opacity: 0, duration: 0.5 }, '+=0.5');
		tl.to(textEl, { scale: 1.5, opacity: 0, duration: 0.5 }, '<');
	}

	$effect(() => {
		play();
	});
</script>

<div
	bind:this={container}
	class="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
	data-testid="one-eighty-effect"
>
	<div
		bind:this={backdrop}
		class="absolute inset-0 opacity-0"
		style="background: radial-gradient(circle, rgba(255,215,0,0.6) 0%, transparent 70%);"
	></div>
	<div
		bind:this={textEl}
		class="text-8xl font-black opacity-0"
		style="color: #ffd700; text-shadow: 0 0 40px rgba(255,215,0,0.8), 0 4px 8px rgba(0,0,0,0.3);"
	>
		180!
	</div>
</div>
