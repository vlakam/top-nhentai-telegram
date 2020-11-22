import Telegraf, { Context } from 'telegraf';
import Grabber from '../grabber';
import { ownerMiddleware } from '../middlewares/ownerMiddleware';

export const setupAddCommand = (bot: Telegraf<Context>) => {
    bot.command('add', ownerMiddleware, async (ctx: Context) => {
        if (ctx.from && ctx.message && ctx.message.entities && ctx.message.text) {
            const urls = ctx.message.entities
                .filter(({ type }) => type === 'url')
                .slice(0, 1)
                .map(({ offset, length }) => ctx.message!.text!.substring(offset, offset + length))
                .filter((url) => url.includes('nhentai'));

            for (const url of urls) {
                const match = url.match(/g\/([0-9]+)\//);
                if (!match) continue;
                const [_, idStr] = match;
                const id = parseInt(idStr);
                const gallery = await new Grabber().processId(id, 'Custom');
            }
        }
    });
};
