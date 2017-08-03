import { SongEmbedType } from './SongEmbedType';

export const songEmbedOptions: { [type: number]: SongEmbedOptions } =
	{
		[SongEmbedType.ADDED]: {
			color: 0xFFFF00,
			descriptionPrefix: '++',
			footer: 'MUSIC_EMBED_FOOTER_ADDED',
		},
		[SongEmbedType.PLAYING]:
		{
			color: 0x00ff08,
			descriptionPrefix: '>>',
			footer: 'MUSIC_EMBED_FOOTER_PLAYING',
		},
		[SongEmbedType.SAVE]:
		{
			color: 8304612,
			descriptionPrefix: '💾',
			footer: 'MUSIC_EMBED_FOOTER_SAVED',
		},
		[SongEmbedType.NP]:
		{
			color: 524543,
			descriptionPrefix: '>>',
			footer: 'MUSIC_EMBED_FOOTER_NP',
		},
	};

export type SongEmbedOptions =
	{
		color: number,
		descriptionPrefix: string,
		footer: string,
	};
