import Telegraf, { Context } from 'telegraf';
import { TagModel } from '../models';

export const setupTagsCommand = (bot: Telegraf<Context>) => {
    bot.command('tags', async (ctx) => {
        const tags = await TagModel.find({});
        return ctx.reply(`Tags: ${tags.map(({ name }) => `#${name}`).join(' ')}`);
    });
};
