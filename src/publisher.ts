import './helpers/env';
import bot from './helpers/bot';
import { Lang } from './helpers/nhentai';
import { Channel, ChannelModel, Gallery, GalleryModel, Tag } from './models';
import { ChannelPostModel } from './models/channelPost';
import { isDocumentArray, Ref } from '@typegoose/typegoose';
import { PUBLISHER_INTERVAL } from './constants/intervals';
import * as schedule from 'node-schedule';
import logger from './helpers/logger';
import { Extra, Markup } from 'telegraf';

const langEmoji: Record<Lang, string> = {
    [Lang.English]: '🇬🇧',
    [Lang.Japanese]: '🇯🇵',
    [Lang.Chinese]: '🇨🇳',
    [Lang.Unknown]: '🏳️',
};

const formatPost = (gallery: Gallery): string => {
    const formatTags = () => {
        if (isDocumentArray(gallery.tags)) {
            return `Tags: ${gallery.tags.map((tag: Tag) => tag.printHashtag()).join(' ')}`;
        } else {
            throw 'Not populated tags';
        }
    };

    const formatLink = () => {
        const { telegraphLinks, title } = gallery;
        if (telegraphLinks.length === 1) return `<a href="${telegraphLinks[0]}">${title}</a>`;
        else {
            return `${title}:\n${telegraphLinks.map((link, idx) => `<a href="${link}">Part ${idx}</a>`).join('\n')}`;
        }
    };

    return `${langEmoji[gallery.lang]} ${formatLink()}\n${formatTags()}\nSection: #${gallery.section}`;
};

export class Publisher {
    constructor() {}

    async process() {
        logger.info('Time to post galleries');
        const channels = await ChannelModel.find({ posting: true });
        for (const channel of channels) {
            await this.processChannel(channel);
        }
    }

    start() {
        const job = schedule.scheduleJob(PUBLISHER_INTERVAL, async () => {
            job.cancel();

            try {
                await this.process();
            } catch (e) {
                logger.info(`Publisher failed: ${e.toString()}. Stack: ${e.stack}`);
            } finally {
                job.reschedule(PUBLISHER_INTERVAL);
            }
        });
    }

    async processChannel(channel: Channel) {
        const posts = await ChannelPostModel.find({ channel: channel });
        const galleries: Array<number> = posts.map((post) => Number(post.gallery));
        const newGalleries = await GalleryModel.find({ _id: { $nin: galleries }, ready: true }).sort({
            uploadedAt: 'asc',
        });

        for (const gallery of newGalleries) {
            await gallery.populate({ path: 'tags', options: { sort: { name: 1 } } }).execPopulate();
            const text = formatPost(gallery);
            const msg = await bot.telegram.sendMessage(
                channel.id,
                text,
                Extra.HTML().markup((m: Markup) => {
                    return m.inlineKeyboard(
                        [[m.callbackButton('0 👍', 'like'), m.callbackButton('0 👎', 'dislike')]],
                        {},
                    );
                }),
            );
            const post = await ChannelPostModel.create({ channel, gallery, messageId: msg.message_id });
            
            await bot.telegram.editMessageReplyMarkup(
                channel.id,
                msg.message_id,
                undefined,
                // @ts-ignore
                Markup.inlineKeyboard([[Markup.callbackButton('0 👍', `like_${post._id}`), Markup.callbackButton('0 👎', `dislike_${post._id}`)]], {}),
            );
            logger.info(`Posted ${gallery.title} to ${channel.title}`);
            break;
        }
    }
}
