import type { Actions } from './$types.js';
import { fail } from '@sveltejs/kit';

const GITHUB_OWNER = 'ChrisMoa';
const GITHUB_REPO = 'DartZone';

// Simple in-memory rate limiting: track last submission time per IP
const lastSubmission = new Map<string, number>();
const COOLDOWN_MS = 60_000; // 1 minute between submissions

export const actions: Actions = {
	default: async ({ request, getClientAddress }) => {
		const data = await request.formData();
		const title = (data.get('title') as string)?.trim() ?? '';
		const category = (data.get('category') as string)?.trim() ?? '';
		const description = (data.get('description') as string)?.trim() ?? '';

		const token = process.env.GITHUB_TOKEN;
		if (!token) {
			return fail(500, {
				error: 'GitHub-Token ist nicht konfiguriert. Bitte GITHUB_TOKEN in der Server-Umgebung setzen.',
				title,
				category,
				description
			});
		}

		const clientIp = getClientAddress();
		const now = Date.now();
		const lastTime = lastSubmission.get(clientIp);
		if (lastTime && now - lastTime < COOLDOWN_MS) {
			const waitSec = Math.ceil((COOLDOWN_MS - (now - lastTime)) / 1000);
			return fail(429, {
				error: `Bitte warte ${waitSec} Sekunden vor dem nächsten Feedback.`,
				title,
				category,
				description
			});
		}

		if (!title || title.length < 3) {
			return fail(400, { error: 'Titel muss mindestens 3 Zeichen lang sein.', title, category, description });
		}
		if (!description || description.length < 10) {
			return fail(400, {
				error: 'Beschreibung muss mindestens 10 Zeichen lang sein.',
				title,
				category,
				description
			});
		}
		const validCategories = ['Bug', 'Feature', 'Sonstiges'];
		if (!category || !validCategories.includes(category)) {
			return fail(400, { error: 'Ungültige Kategorie.', title, category, description });
		}

		const labelMap: Record<string, string> = {
			Bug: 'bug',
			Feature: 'enhancement',
			Sonstiges: 'feedback'
		};

		const issueTitle = `[${category}] ${title}`;
		const issueBody = `**Kategorie:** ${category}\n\n${description}\n\n---\n*Erstellt über DartZone In-App Feedback*`;

		const labels = [labelMap[category]].filter(Boolean);

		const response = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
				Accept: 'application/vnd.github+json',
				'Content-Type': 'application/json',
				'X-GitHub-Api-Version': '2022-11-28'
			},
			body: JSON.stringify({
				title: issueTitle,
				body: issueBody,
				labels
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('GitHub API error:', response.status, errorText);
			return fail(502, {
				error: 'Fehler beim Erstellen des GitHub-Issues. Bitte später erneut versuchen.',
				title,
				category,
				description
			});
		}

		const issue = await response.json();
		lastSubmission.set(clientIp, Date.now());

		return { success: true, issueUrl: issue.html_url, issueNumber: issue.number };
	}
};
