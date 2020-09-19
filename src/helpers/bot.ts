import Telegraf from 'telegraf';
import { setupAddCommand } from '../commands/add';
import { setupTagsCommand } from '../commands/tags';
import { errorMiddleware } from '../middlewares/errorMiddleware';
import { ChannelModel } from '../models';
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

export default bot;
