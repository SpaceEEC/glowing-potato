import { CommandDecorators, Message } from 'yamdbf';

import { ReportError } from '../../decorators/ReportError';
import { Client } from '../../structures/Client';
import { Command } from '../../structures/Command';
import { AniType } from '../../types/AniType';
import { AnilistUtil } from '../../util/AniListUtil';

const { aliases, clientPermissions, desc, group, guildOnly, name, usage } = CommandDecorators;

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
