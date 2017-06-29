import { Command, Message } from 'yamdbf/bin';
import { clientPermissions, desc, group, guildOnly,  name, usage } from 'yamdbf/bin/command/CommandDecorators';

import { Client } from '../../structures/Client';
import { ReportError } from '../../structures/ReportError';
import { AniType } from '../../types/AniType';
import { AnilistUtil } from '../../util/AniList';

@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS')
@desc('Displays information about the requested anime.')
@name('anime')
@group('weebstuff')
@guildOnly
@usage('<prefix>anime <Name>')
export default class AnimeCommand extends Command<Client>
{
	@ReportError
	public action(message: Message, args: string[]): Promise<void>
	{
		return AnilistUtil.run(AniType.ANIME, args.join(' '), message);
	}
}
