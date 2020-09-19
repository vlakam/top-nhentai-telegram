import Telegraf, { Context } from 'telegraf';
import { TagModel } from '../models';

export const setupTagsCommand = (bot: Telegraf<Context>) => {
    bot.command('tags', async (ctx) => {
        const tags = await TagModel.find({});
        const tagHashTags = tags.map((tag) => tag.printHashtag());
        return ctx.reply(`Tags: ${tagHashTags.join(' ')}`);
    });
};
