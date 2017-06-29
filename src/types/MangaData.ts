export type MangaData = {
	id: number;
	series_type: string;
	title_romaji: string;
	title_english: string;
	title_japanese: string;
	type: string;
	start_date_fuzzy: number;
	end_date_fuzzy: number;
	season: number;
	description: string;
	synonyms: string[];
	genres: string[];
	adult: string;
	average_score: number;
	popularity: number;
	image_url_sml: string;
	image_url_med: string;
	image_url_lge: string;
	image_url_banner: string;
	updated_at: number;
	score_distribution: {
		10: number;
		20: number;
		30: number;
		40: number;
		50: number;
		60: number;
		70: number;
		80: number;
		90: number;
		100: number;
	};
	list_stats: {
		completed: number;
		on_hold: number;
		dropped: number;
		plan_to_watch: number;
		watching: number;
	};
	total_chapters: number;
	total_volumes: number;
	publishing_status: string;
};
