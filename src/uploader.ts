import { GalleryModel } from './models';
import * as NH from './helpers/nhentai';
import { uploadByUrl } from './helpers/telegraphUpload';
import fetch from 'node-fetch';
import { pause } from './helpers/pause';
import { UPLOADER_INTERVAL } from './constants/intervals';
import logger from './helpers/logger';
import { chunkArray } from './helpers/chunkArray';

const { TELEGRAPH_TOKEN } = process.env;
const TELEGRAPH_ROOT = 'https://api.telegra.ph';

const generatePageContent = (name: string, images: Array<string>) => {
    const createFigure = (figCaption: string = '', imageLink: string) => ({
        tag: 'figure',
        children: [
            {
                tag: 'img',
                attrs: {
                    src: imageLink,
                },
            },
            {
                tag: 'figcaption',
                children: [figCaption],
            },
        ],
    });

    const createDelim = () => ({
        tag: 'p',
        children: [
            {
                tag: 'br',
            },
        ],
    });

    return [
        createFigure(name, images[0]),
        createDelim(),
        ...images.slice(1).flatMap((imageLink) => [createFigure('', imageLink), createDelim()]),
    ];
};

export default class Uploader {
    authorName: string = 'Unnamed';
    authorUrl: string = '';
    constructor() {}

    async init() {
        const data = await this.requestTelegraph('getAccountInfo', {
            access_token: TELEGRAPH_TOKEN,
        });

        this.authorName = data.author_name || this.authorName;
        this.authorUrl = data.author_url || this.authorUrl;
        logger.info(`Uploader init: ${this.authorName}(${this.authorUrl})`);
    }

    async start() {
        setTimeout(async () => {
            try {
                await this.process();
            } catch (e) {
                logger.info(`Uploader failed: ${e.toString()}. Stack: ${e.stack}`);
            }
            this.start();
        }, UPLOADER_INTERVAL);
    }

    async requestTelegraph(method: string, data: any) {
        const response = await fetch(`${TELEGRAPH_ROOT}/${method}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error(response.statusText || 'Error calling telegraph');

        const json = await response.json();
        if (json.ok == false) {
            throw new Error(json.error || 'Error calling telegraph');
        }

        return json.result;
    }

    async process() {
        logger.info('galleries, time to upload galleries to telegraph and get my ass banned');
        const queue = await GalleryModel.find({ ready: false, problematic: { $exists: false } });
        for (const gallery of queue) {
            try {
                logger.info(
                    `ID: ${gallery.id}. Image count: ${gallery.images.length}. Uploaded already: ${gallery.telegraphImages.length}`,
                );
                for (let i = gallery.telegraphImages.length; i < gallery.images.length; i++) {
                    try {
                        const imageLink = gallery.images[i];
                        const uploadedImages = await uploadByUrl(imageLink);
                        gallery.telegraphImages.push(uploadedImages.link);
                        await gallery.save();

                        logger.info(`uploaded: ${imageLink}`);
                    } catch (e) {
                        gallery.problematic = `${(gallery.problematic || '')}\n${i}:${e.toString()}`;
                        gallery.telegraphImages.push('https://telegra.ph/file/b633c9d6c158eaf9acc6c.jpg');
                        await gallery.save();
                        logger.info(`${i}:${e.toString()}`);
                    }
                    await pause(Math.random() * 25000 + 10000);
                }

                const telegraphPages = [];
                for (const part of chunkArray(gallery.telegraphImages, 250)) {
                    const content = generatePageContent(gallery.title, part);
                    const telegraphPage = await this.requestTelegraph('createPage', {
                        access_token: TELEGRAPH_TOKEN,
                        title: gallery.title,
                        author_name: this.authorName,
                        author_url: this.authorUrl,
                        content,
                        return_content: true,
                    });

                    telegraphPages.push(telegraphPage.url);
                }                

                logger.info(`Uploaded ${gallery.id}:${gallery.title} to telegraph - ${telegraphPages.join(' ')}`);
                gallery.telegraphLinks = telegraphPages;
                gallery.ready = true;
                await gallery.save();
                logger.info(`${gallery.id}:${gallery.title} - is now ready`);
                break;
            } catch (e) {
                logger.error(`Failed to upload gallery: ${gallery.title} - ${e.toString()}. ${e.stack}`);
                gallery.problematic = e.toString();
                await gallery.save();
                //throw e;
            }
        }
    }
}

// new Uploader('@PopularNHentaiBot', 'https://t.me/PopularNHentaiBot').process();
