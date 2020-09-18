import * as NH from './helpers/nhentai';

import { GalleryModel, TagModel } from './models';
import { GRABBER_INTERVAL } from './constants/intervals';

export default class Grabber {
    constructor() {}

    start() {
        setTimeout(async () => {
            try {
                await this.process();
            } catch (e) {
                console.log(`Grabber failed: ${e.toString()}. Stack: ${e.stack}`);
            }
            this.start();
        }, GRABBER_INTERVAL);
    }

    async process() {
        console.log('galleries, time to grab some galleries!');
        const homePage = await NH.getHomepage();
        if (!homePage.popular) {
            console.log('No populars this time ;(');
            return;
        }

        for (const popular of homePage.popular) {
            try {
                await this.processId(popular.id);
            } catch (e) {
                console.log(`Failed to query base at grab: ${e.toString()}: ${e.stack}`);
                throw e;
            }
        }
    }

    async processId(id: number) {
        const queuedGallery = await GalleryModel.findById(id);
        if (queuedGallery) return; // this gallery is already queued for uploading

        const galleryInfo = await NH.getGalleryInfo(id);
        const tags = galleryInfo.details.has('tags') ? galleryInfo.details.get('tags')! : [];
        await GalleryModel.create({
            ready: false,
            lang: galleryInfo.lang,
            _id: id,
            telegraphImages: [],
            telegraphLinks: [],
            tags: tags.map((tag) => tag.code),
            details: galleryInfo.details,
            title: galleryInfo.title,
            nativeTitle: galleryInfo.nativeTitle,
            images: galleryInfo.images,
            thumbs: galleryInfo.thumbs,
        });

        for (const tag of tags) await TagModel.registerTag(tag);
        console.log(`Saved to queue: ${id}`);
    }
}
