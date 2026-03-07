import { z } from 'zod';

export const clubSchema = z.object({
	name: z
		.string()
		.min(2, 'Name muss mindestens 2 Zeichen lang sein')
		.max(100, 'Name darf maximal 100 Zeichen lang sein'),
	short_name: z
		.string()
		.min(2, 'Kurzname muss mindestens 2 Zeichen lang sein')
		.max(10, 'Kurzname darf maximal 10 Zeichen lang sein'),
	crest_url: z.string().url('Ungueltige URL').nullable().optional().default(null),
	primary_color: z
		.string()
		.regex(/^#[0-9a-fA-F]{6}$/, 'Ungueltige Farbe (Hex-Format: #RRGGBB)')
		.default('#1a5276'),
	secondary_color: z
		.string()
		.regex(/^#[0-9a-fA-F]{6}$/, 'Ungueltige Farbe (Hex-Format: #RRGGBB)')
		.default('#ffffff'),
	contact_email: z
		.string()
		.email('Ungueltige E-Mail-Adresse')
		.nullable()
		.optional()
		.default(null)
});

export const playerSchema = z.object({
	club_id: z.string().nullable().optional().default(null),
	first_name: z
		.string()
		.min(1, 'Vorname ist erforderlich')
		.max(50, 'Vorname darf maximal 50 Zeichen lang sein'),
	last_name: z
		.string()
		.min(1, 'Nachname ist erforderlich')
		.max(50, 'Nachname darf maximal 50 Zeichen lang sein'),
	nickname: z
		.string()
		.max(30, 'Spitzname darf maximal 30 Zeichen lang sein')
		.nullable()
		.optional()
		.default(null)
});

export const tournamentSchema = z.object({
	name: z
		.string()
		.min(2, 'Name muss mindestens 2 Zeichen lang sein')
		.max(100, 'Name darf maximal 100 Zeichen lang sein'),
	game_mode: z.enum(['501', '301', 'cricket']),
	format: z.enum(['round_robin', 'knockout']),
	legs_per_set: z.number().int().min(1).max(15),
	sets_per_match: z.number().int().min(1).max(13),
	start_date: z.string().nullable().optional().default(null),
	end_date: z.string().nullable().optional().default(null),
	is_active: z.boolean().default(false)
});

export type ClubFormData = z.infer<typeof clubSchema>;
export type PlayerFormData = z.infer<typeof playerSchema>;
export type TournamentFormData = z.infer<typeof tournamentSchema>;
