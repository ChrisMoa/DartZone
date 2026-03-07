import { gsap } from 'gsap';

export function createPulseTimeline(element: HTMLElement, color: string): gsap.core.Timeline {
	const tl = gsap.timeline();

	tl.fromTo(
		element,
		{ scale: 0.5, opacity: 0 },
		{ scale: 1.5, opacity: 1, duration: 0.3, ease: 'power2.out' }
	).to(element, {
		scale: 2,
		opacity: 0,
		duration: 0.5,
		ease: 'power1.in'
	});

	return tl;
}

export function createParticles(
	container: HTMLElement,
	count: number,
	colors: string[]
): HTMLElement[] {
	const particles: HTMLElement[] = [];
	const rect = container.getBoundingClientRect();
	const centerX = rect.width / 2;
	const centerY = rect.height / 2;

	for (let i = 0; i < count; i++) {
		const particle = document.createElement('div');
		particle.style.position = 'absolute';
		particle.style.width = '8px';
		particle.style.height = '8px';
		particle.style.borderRadius = '50%';
		particle.style.backgroundColor = colors[i % colors.length];
		particle.style.left = `${centerX}px`;
		particle.style.top = `${centerY}px`;
		particle.style.pointerEvents = 'none';
		container.appendChild(particle);
		particles.push(particle);
	}

	return particles;
}

export function animateParticleBurst(particles: HTMLElement[], radius: number): gsap.core.Timeline {
	const tl = gsap.timeline();

	particles.forEach((particle, i) => {
		const angle = (i / particles.length) * Math.PI * 2;
		const distance = radius * (0.5 + Math.random() * 0.5);

		tl.to(
			particle,
			{
				x: Math.cos(angle) * distance,
				y: Math.sin(angle) * distance,
				opacity: 0,
				scale: 0,
				duration: 0.8 + Math.random() * 0.4,
				ease: 'power2.out'
			},
			0
		);
	});

	return tl;
}

export function cleanupParticles(particles: HTMLElement[]): void {
	particles.forEach((p) => p.remove());
}
