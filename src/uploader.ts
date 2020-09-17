import './helpers/env';

import { GalleryModel } from './models';
import * as NH from './helpers/nhentai';
import { uploadByUrl } from './helpers/telegraphUpload';
import fetch from 'node-fetch';
import { pause } from './helpers/pause';
import { UPLOADER_INTERVAL } from './constants/intervals';

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
        console.log(`Uploader init: ${this.authorName}(${this.authorUrl})`);
    }

    async start() {
        setTimeout(async () => {
            try {
                await this.process();
            } catch (e) {
                console.log(`Uploader failed: ${e.toString()}. Stack: ${e.stack}`);
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
        console.log('galleries, time to upload galleries to telegraph and get my ass banned');
        const queue = await GalleryModel.find({ready: false});
        for (const gallery of queue) {
            try {
                console.log(`ID: ${gallery.id}. Image count: ${gallery.images.length}. Uploaded already: ${gallery.telegraphImages.length}`);
                for(let i = gallery.telegraphImages.length; i < gallery.images.length; i++) {
                    const imageLink = gallery.images[i];
                    const uploadedImages = await uploadByUrl(imageLink);
                    gallery.telegraphImages.push(uploadedImages.link);
                    await gallery.save();

                    console.log(`uploaded: ${imageLink}`);
                    await pause(Math.random() * 1000);
                }

                const content = generatePageContent(gallery.title, gallery.telegraphImages);
                const telegraphPage = await this.requestTelegraph('createPage', {
                    access_token: TELEGRAPH_TOKEN,
                    title: gallery.title,
                    author_name: this.authorName,
                    author_url: this.authorUrl,
                    content,
                    return_content: true,
                });

                console.log(`Uploaded ${gallery.id}:${gallery.title} to telegraph - ${telegraphPage.url}`);
                gallery.telegraphLinks.push(telegraphPage.url);
                gallery.ready = true;
                await gallery.save();
                console.log(`${gallery.id}:${gallery.title} - is now ready`);
                break;
            } catch (e) {
                console.error(`Failed to upload gallery: ${gallery.title} - ${e.toString()}. ${e.stack}`);
                throw e;
            }
        }
    }
}

// new Uploader('@PopularNHentaiBot', 'https://t.me/PopularNHentaiBot').process();
