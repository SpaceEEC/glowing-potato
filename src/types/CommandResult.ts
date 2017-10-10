import {Attachment, Message, RichEmbed } from 'discord.js';

export type CommandResult = Attachment | Message | Message[] | null | RichEmbed | string | void;
