<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from 'gsap';
	import { createParticles, cleanupParticles } from './animation.utils.js';

	interface Props {
		playerName?: string;
		ondone?: () => void;
	}

	let { playerName = '', ondone }: Props = $props();

	let container: HTMLElement;
	let banner: HTMLElement;

	onMount(() => {
		// Confetti particles
		const confettiColors = [
			'#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#ffd700'
		];
		const confetti: HTMLElement[] = [];
		const rect = container.getBoundingClientRect();

		for (let i = 0; i < 50; i++) {
			const particle = document.createElement('div');
			const size = 4 + Math.random() * 8;
			const isRect = Math.random() > 0.5;
			particle.style.position = 'absolute';
			particle.style.width = `${size}px`;
			particle.style.height = `${isRect ? size * 2 : size}px`;
			particle.style.borderRadius = isRect ? '2px' : '50%';
			particle.style.backgroundColor = confettiColors[i % confettiColors.length];
			particle.style.left = `${Math.random() * rect.width}px`;
			particle.style.top = '-20px';
			particle.style.pointerEvents = 'none';
			container.appendChild(particle);
			confetti.push(particle);
		}

		const tl = gsap.timeline({
			onComplete: () => {
				cleanupParticles(confetti);
				ondone?.();
			}
		});

		// Confetti fall
		confetti.forEach((p) => {
			tl.to(
				p,
				{
					y: rect.height + 40,
					x: `+=${(Math.random() - 0.5) * 200}`,
					rotation: Math.random() * 720 - 360,
					duration: 1.5 + Math.random() * 1,
					ease: 'power1.in'
				},
				Math.random() * 0.3
			);
		});

		// Victory banner
		tl.fromTo(
			banner,
			{ y: -100, opacity: 0 },
			{ y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' },
			0
		);

		// Banner fade out
		tl.to(banner, { y: -50, opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=1');

		return () => tl.kill();
	});
</script>

<div
	bind:this={container}
	class="fixed inset-0 pointer-events-none z-50 flex items-start justify-center pt-20"
	data-testid="checkout-effect"
>
	<div
		bind:this={banner}
		class="bg-success text-success-content px-8 py-4 rounded-2xl shadow-2xl text-center opacity-0"
	>
		<div class="text-3xl font-black">CHECKOUT!</div>
		{#if playerName}
			<div class="text-lg mt-1">{playerName} gewinnt das Leg!</div>
		{/if}
	</div>
</div>
