import { SongEmbedType } from './SongEmbedType';

export const songEmbedOptions: { [type: number]: SongEmbedOptions } =
	{
		[SongEmbedType.ADDED]: {
			color: 0xFFFF00,
			descriptionPrefix: '++',
			footer: 'has been added.',
		},
		[SongEmbedType.PLAYING]:
		{
			color: 0x00ff08,
			descriptionPrefix: '>>',
			footer: 'is now being played.',
		},
		[SongEmbedType.SAVE]:
		{
			color: 8304612,
			descriptionPrefix: '💾',
			footer: 'saved, just for you.',
		},
		[SongEmbedType.NP]:
		{
			color: 524543,
			descriptionPrefix: '>>',
			footer: 'currently playing.',
		},
	};

export type SongEmbedOptions =
	{
		color: number,
		descriptionPrefix: string,
		footer: string,
	};
