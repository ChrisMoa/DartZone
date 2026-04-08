import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import DrinkingInputCard from '$lib/components/drinking/DrinkingInputCard.svelte';

const baseProps = {
	club_id: 'club-1',
	club_name: 'Dart Club Alpha',
	has_crest: false,
	primary_color: '#e11d48',
	drink_count: 3,
	disabled: false
};

describe('DrinkingInputCard Component', () => {
	it('renders club name and drink count', async () => {
		render(DrinkingInputCard, { props: baseProps });
		const name = page.getByTestId('drinking-input-name');
		await expect.element(name).toHaveTextContent('Dart Club Alpha');
		const count = page.getByTestId('drinking-input-count');
		await expect.element(count).toHaveTextContent('3');
	});

	it('renders increment and decrement buttons', async () => {
		render(DrinkingInputCard, { props: baseProps });
		const incBtn = page.getByTestId('drinking-increment-btn');
		await expect.element(incBtn).toBeVisible();
		await expect.element(incBtn).toHaveTextContent('+');
		const decBtn = page.getByTestId('drinking-decrement-btn');
		await expect.element(decBtn).toBeVisible();
		await expect.element(decBtn).toHaveTextContent('-');
	});

	it('calls onincrement when + is clicked', async () => {
		const onincrement = vi.fn();
		render(DrinkingInputCard, { props: { ...baseProps, onincrement } });
		const incBtn = page.getByTestId('drinking-increment-btn');
		await incBtn.click();
		expect(onincrement).toHaveBeenCalledOnce();
	});

	it('calls ondecrement when - is clicked', async () => {
		const ondecrement = vi.fn();
		render(DrinkingInputCard, { props: { ...baseProps, ondecrement } });
		const decBtn = page.getByTestId('drinking-decrement-btn');
		await decBtn.click();
		expect(ondecrement).toHaveBeenCalledOnce();
	});

	it('disables buttons when disabled prop is true', async () => {
		render(DrinkingInputCard, { props: { ...baseProps, disabled: true } });
		const incBtn = page.getByTestId('drinking-increment-btn');
		await expect.element(incBtn).toBeDisabled();
		const decBtn = page.getByTestId('drinking-decrement-btn');
		await expect.element(decBtn).toBeDisabled();
	});

	it('disables decrement button when drink_count is 0', async () => {
		render(DrinkingInputCard, { props: { ...baseProps, drink_count: 0 } });
		const decBtn = page.getByTestId('drinking-decrement-btn');
		await expect.element(decBtn).toBeDisabled();
		const incBtn = page.getByTestId('drinking-increment-btn');
		await expect.element(incBtn).not.toBeDisabled();
	});
});
