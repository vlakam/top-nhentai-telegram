import Telegraf, { Context } from 'telegraf';
import { errorMiddleware } from '../middlewares/errorMiddleware';
import { ChannelModel, GalleryModel, GalleryPageModel } from '../models';
import * as NH from './nhentai';
const { TELEGRAM_TOKEN, OWNER_ID } = process.env;
if (!TELEGRAM_TOKEN) {
    console.log('No telegram token specified');
    process.exit(1);
}

const owner = parseInt(OWNER_ID || '0');
const bot = new Telegraf(TELEGRAM_TOKEN);
bot.use(errorMiddleware);

bot.on('channel_post', async (ctx) => {
    console.log('channel_post');
    const { id, title } = ctx.channelPost!.chat;
    await ChannelModel.registerChannel({ id, title: title || 'unknown' });
});

bot.on('message', async (ctx) => {
    if (ctx.from && ctx.from.id == owner && ctx.message && ctx.message.entities && ctx.message.text) {
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
            const gallery = await NH.getGalleryInfo(id);
            const langs = gallery.details.get('Languages');
            let galleryLang = 'UN';
            if (langs)
                for (const lang of langs) {
                    galleryLang = NH.langTags[lang.code] || NH.Lang.Unknown;
                }

            const queuedGallery = await GalleryPageModel.findById(id);
            if (queuedGallery) continue; // this gallery is already queued for uploading
            const uploadedGallery = await GalleryModel.findById(id);
            if (uploadedGallery) continue;

            const newModel = new GalleryPageModel({
                id,
                title: gallery.title,
                lang: galleryLang,
                thumb: 'shit',
            });
            await newModel.save();
            console.log(`Saved to queue: ${id}`);
        }

        return;
    }
    await ctx.reply(`I dont work in chats at this moment. Please add me to channel`);
});

export default bot;
