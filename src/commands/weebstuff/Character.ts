import { Command, Message } from 'yamdbf/bin';
import { aliases, clientPermissions, desc, group, guildOnly, name, usage } from 'yamdbf/bin/command/CommandDecorators';

import { Client } from '../../structures/Client';
import { ReportError } from '../../structures/ReportError';
import { AniType } from '../../types/AniType';
import { AnilistUtil } from '../../util/AniList';

@aliases('char')
@clientPermissions('SEND_MESSAGES', 'EMBED_LINKS')
@desc('Displays information about the requested character.')
@name('character')
@group('weebstuff')
@guildOnly
@usage('<prefix>char <Name>')
export default class CharacterCommand extends Command<Client>
{
	@ReportError
	public action(message: Message, args: string[]): Promise<void>
	{
		return AnilistUtil.run(AniType.CHARACTER, args.join(' '), message);
	}
}
