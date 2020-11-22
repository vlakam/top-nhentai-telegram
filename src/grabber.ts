import * as NH from './helpers/nhentai';

import { Gallery, GalleryModel, TagModel } from './models';
import { GRABBER_INTERVAL } from './constants/intervals';
import logger from './helpers/logger';
import { DocumentType } from '@typegoose/typegoose';

export default class Grabber {
    constructor() {}

    start() {
        setTimeout(async () => {
            try {
                await this.process();
            } catch (e) {
                logger.error(`Grabber failed: ${e.toString()}. Stack: ${e.stack}`);
            }
            this.start();
        }, GRABBER_INTERVAL);
    }

    async process() {
        logger.info('galleries, time to grab some galleries!');
        const homePage = await NH.getHomepage();
        if (!homePage.popular) {
            logger.info('No populars this time ;(');
            return;
        }

        for (const popular of homePage.popular) {
            try {
                await this.processId(popular.id);
            } catch (e) {
                logger.error(`Failed to query base at grab: ${e.toString()}: ${e.stack}`);
                throw e;
            }
        }
    }

    async processId(id: number, section?: string): Promise<DocumentType<Gallery>> {
        const queuedGallery = await GalleryModel.findById(id);
        if (queuedGallery) return queuedGallery; // this gallery is already queued for uploading

        const galleryInfo = await NH.getGalleryInfo(id);
        const tags = galleryInfo.details.has('tags') ? galleryInfo.details.get('tags')! : [];
        const gallery = await GalleryModel.create({
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
            uploadedAt: galleryInfo.uploadedAt,
            section: section,
            createdAt: new Date(),
        });

        for (const tag of tags) await TagModel.registerTag(tag);
        logger.info(`Saved to queue: ${id}`);

        return gallery;
    }
}
