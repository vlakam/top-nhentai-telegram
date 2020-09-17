import './helpers/env';

import { GalleryModel, GalleryPageModel, TagModel } from './models';
import * as NH from './helpers/nhentai';
import { uploadByUrl } from './helpers/telegraphUpload';
import fetch from 'node-fetch';
import { pause } from './helpers/pause';

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
    working: boolean = true;
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
        await this.init();
        await this.process();
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
        if (!this.working) {
            throw new Error('Uploading failed once. So i dont upload anymore');
        }
        console.log('galleries, time to upload galleries to telegraph and get my ass banned');
        const queue = await GalleryPageModel.find({});
        for (const gallery of queue) {
            try {
                const checkGallery = await GalleryModel.findById(gallery.id);
                if (checkGallery) {
                    console.log(`${gallery.id} already uploaded. Deleting from queue`);
                    await GalleryPageModel.findByIdAndDelete(gallery.id);
                    continue;
                }

                const galleryInfo = await NH.getGalleryInfo(gallery.id);

                const tags = galleryInfo.details.has('Tags') ? galleryInfo.details.get('Tags')! : [];
                for (const tag of tags) await TagModel.registerTag(tag);

                const imagesOnTelegraph = [];
                for (const imageLink of galleryInfo.images) {
                    const uploadedImages = await uploadByUrl(imageLink);
                    console.log(`uploaded: ${imageLink}`);
                    imagesOnTelegraph.push(uploadedImages.link);
                    await pause(Math.random() * 1000);
                }
                const content = generatePageContent(galleryInfo.title, imagesOnTelegraph);
                const telegraphPage = await this.requestTelegraph('createPage', {
                    access_token: TELEGRAPH_TOKEN,
                    title: galleryInfo.title,
                    author_name: this.authorName,
                    author_url: this.authorUrl,
                    content,
                    return_content: true,
                });

                console.log(`${gallery.title}: ${telegraphPage.url}`);
                const uploadedGallery = new GalleryModel({
                    ...galleryInfo,
                    telegraphLink: telegraphPage.url,
                    tags: tags.map((tag) => tag.code),
                    lang: gallery.lang,
                });
                await uploadedGallery.save();
                await GalleryPageModel.findByIdAndDelete(gallery.id);
                console.log(`Uploaded ${gallery.id}:${gallery.title} to telegraph - OK`);

                break;
            } catch (e) {
                console.error(`Failed to upload gallery: ${gallery.title} - ${e.toString()}`);
                this.working = false;
            }
        }
    }
}

// new Uploader('@PopularNHentaiBot', 'https://t.me/PopularNHentaiBot').process();
