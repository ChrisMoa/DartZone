export interface Club {
	id: string;
	name: string;
	short_name: string;
	crest_url: string | null;
	has_crest: boolean;
	primary_color: string;
	secondary_color: string;
	contact_email: string | null;
	created_at: string;
	updated_at: string;
}

export interface Player {
	id: string;
	club_id: string | null;
	first_name: string;
	last_name: string;
	nickname: string | null;
	created_at: string;
}
