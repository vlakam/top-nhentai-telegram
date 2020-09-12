import Telegraf from 'telegraf';
import { errorMiddleware } from '../middlewares/errorMiddleware';
import { ChannelModel } from '../models';
const { TELEGRAM_TOKEN } = process.env;
if (!TELEGRAM_TOKEN) {
    console.log('No telegram token specified');
    process.exit(1);
}
const bot = new Telegraf(TELEGRAM_TOKEN);
bot.use(errorMiddleware);

bot.on('channel_post', async (ctx) => {
    console.log('channel_post');
    const { id, title } = ctx.channelPost!.chat;
    await ChannelModel.registerChannel({ id, title: title || 'unknown' });
});

bot.on('message', async (ctx) => {
    await ctx.reply(`I dont work in chats at this moment. Please add me to channel`);
});

export default bot;
