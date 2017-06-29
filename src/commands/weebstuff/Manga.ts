import { Command, Message } from 'yamdbf/bin';
import { clientPermissions, desc, group, guildOnly, name, usage } from 'yamdbf/bin/command/CommandDecorators';

import { Client } from '../../structures/Client';
import { ReportError } from '../../structures/ReportError';
import { AniType } from '../../types/AniType';
import { AnilistUtil } from '../../util/AniList';

@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS')
@desc('Displays information about the requested manga.')
@name('manga')
@group('weebstuff')
@guildOnly
@usage('<prefix>manga <Name>')
export default class MangaCommand extends Command<Client>
{
	@ReportError
	public action(message: Message, args: string[]): Promise<void>
	{
		return AnilistUtil.run(AniType.MANGA, args.join(' '), message);
	}
}
