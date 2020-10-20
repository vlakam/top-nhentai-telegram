import Telegraf, { Context } from 'telegraf';
import { ownerMiddleware } from '../middlewares/ownerMiddleware';
import { TagModel } from '../models';

export const setupTagsCommand = (bot: Telegraf<Context>) => {
    bot.command('tags', ownerMiddleware, async (ctx) => {
        const tags = await TagModel.find({}, null, { sort: { name: 1 } });
        const tagHashTags = tags.map((tag) => tag.printHashtag());
        return ctx.reply(`Tags: ${tagHashTags.join(' ')}`);
    });
};
