import Telegraf, { Markup } from 'telegraf';
import { setupAddCommand } from '../commands/add';
import { setupTagsCommand } from '../commands/tags';
import { errorMiddleware } from '../middlewares/errorMiddleware';
import { ChannelModel } from '../models';
import { ChannelPostModel } from '../models/channelPost';
import logger from './logger';

const { TELEGRAM_TOKEN, OWNER_ID } = process.env;
if (!TELEGRAM_TOKEN) {
    logger.error('No telegram token specified');
    process.exit(1);
}

const bot = new Telegraf(TELEGRAM_TOKEN);
bot.use(errorMiddleware);
setupTagsCommand(bot);
setupAddCommand(bot);

bot.on('channel_post', async (ctx) => {
    logger.info('channel_post');
    const { id, title } = ctx.channelPost!.chat;
    await ChannelModel.registerChannel({ id, title: title || 'unknown' });
});

bot.on('message', async (ctx) => {
    await ctx.reply(`I dont work in chats at this moment. Please add me to channel`);
});

bot.action(/(like|dislike)_(.+)/, async (ctx) => {
    if (!ctx.match || !ctx.update.callback_query) return;

    const [_, action, postId] = ctx.match;
    const { from: user } = ctx.update.callback_query;
    const post = await ChannelPostModel.findById(postId);
    if (!post || !post.liked || !post.disliked) {
        return ctx.answerCbQuery('Not found');
    }

    post.liked = post.liked.filter((userId) => userId !== user.id);
    post.disliked = post.disliked.filter((userId) => userId !== user.id);
    if (action === 'like') {
        post.liked.push(user.id);
        ctx.answerCbQuery('You 👍 this');
    } else {
        post.disliked.push(user.id);
        ctx.answerCbQuery('You 👎 this');
    }

    await post.save();
    return ctx.telegram.editMessageReplyMarkup(
        (post.channel as any) as number,
        post.messageId,
        undefined,
        // @ts-ignore
        Markup.inlineKeyboard(
            [
                [
                    
                    Markup.callbackButton(`${post.liked.length} 👍`, `like_${post._id}`),
                    Markup.callbackButton(`${post.disliked.length} 👎`, `dislike_${post._id}`),
                ],
            ],
            {},
        ),
    );
});

export default bot;
