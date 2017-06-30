import { RichEmbed as DJSRichEmbed } from 'discord.js';

export class RichEmbed extends DJSRichEmbed
{
	/**
	 * Splits up a long string into multiple fields for this embed.
	 * @param {string} title The title of the first field
	 * @param {string} text The long string to split up
	 * @param {boolean} [inline=false] Whether the fields should be inline
	 * @returns {RichEmbed}
	 */
	public splitToFields(title: string = '\u200b', text: string, inline: boolean = false): RichEmbed
	{
		const stringArray: string[] = text.match(/(.|[\r\n]){1,1024}/g);

		for (const [i, chunk] of stringArray.entries())
		{
			this.addField(i ? '\u200b' : title, chunk, inline);
		}

		return this;
	}
}
