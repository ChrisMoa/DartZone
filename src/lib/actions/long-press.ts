/**
 * Svelte action: trigger `onpress` only after the user has held the element
 * for `duration` ms. Renders a progress fill inside the element so the user
 * sees the gesture filling up. Cancels when the user releases or moves away.
 *
 * Usage:
 *   <button use:longPress={{ onpress: () => addDrinks(id, 5), duration: 550 }}>
 */
export interface LongPressOptions {
	onpress: () => void;
	duration?: number;
	disabled?: () => boolean;
}

export function longPress(node: HTMLElement, options: LongPressOptions) {
	let opts = options;
	const duration = () => opts.duration ?? 550;

	const overlay = document.createElement('span');
	overlay.setAttribute('aria-hidden', 'true');
	overlay.style.cssText = [
		'position:absolute',
		'inset:0',
		'background:currentColor',
		'opacity:0.28',
		'transform:scaleX(0)',
		'transform-origin:left center',
		'pointer-events:none',
		'transition:none',
		'border-radius:inherit'
	].join(';');

	if (getComputedStyle(node).position === 'static') {
		node.style.position = 'relative';
	}
	node.style.overflow = 'hidden';
	node.appendChild(overlay);

	let active = false;
	let raf = 0;
	let startTime = 0;

	const start = (e: Event) => {
		if (opts.disabled?.()) return;
		// prevent the default tap behaviour but allow scrolling on touch surfaces
		if (e.type === 'mousedown') e.preventDefault();
		active = true;
		startTime = performance.now();
		tick();
	};

	const tick = () => {
		if (!active) return;
		const elapsed = performance.now() - startTime;
		const progress = Math.min(1, elapsed / duration());
		overlay.style.transform = `scaleX(${progress})`;
		if (progress >= 1) {
			active = false;
			// brief flash to acknowledge fire, then reset
			overlay.style.opacity = '0.55';
			setTimeout(() => {
				overlay.style.transform = 'scaleX(0)';
				overlay.style.opacity = '0.28';
			}, 120);
			opts.onpress();
			return;
		}
		raf = requestAnimationFrame(tick);
	};

	const cancel = () => {
		if (!active) return;
		active = false;
		cancelAnimationFrame(raf);
		// quick decay back to 0
		overlay.style.transition = 'transform 120ms ease-out';
		overlay.style.transform = 'scaleX(0)';
		setTimeout(() => {
			overlay.style.transition = 'none';
		}, 130);
	};

	const onContextMenu = (e: Event) => e.preventDefault();

	node.addEventListener('mousedown', start);
	node.addEventListener('mouseup', cancel);
	node.addEventListener('mouseleave', cancel);
	node.addEventListener('touchstart', start, { passive: true });
	node.addEventListener('touchend', cancel);
	node.addEventListener('touchcancel', cancel);
	node.addEventListener('contextmenu', onContextMenu);

	return {
		update(newOptions: LongPressOptions) {
			opts = newOptions;
		},
		destroy() {
			node.removeEventListener('mousedown', start);
			node.removeEventListener('mouseup', cancel);
			node.removeEventListener('mouseleave', cancel);
			node.removeEventListener('touchstart', start);
			node.removeEventListener('touchend', cancel);
			node.removeEventListener('touchcancel', cancel);
			node.removeEventListener('contextmenu', onContextMenu);
			cancelAnimationFrame(raf);
			overlay.remove();
		}
	};
}
