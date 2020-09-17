import * as NH from './helpers/nhentai';

import { GalleryModel, GalleryPageModel } from './models';
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
                const queuedGallery = await GalleryPageModel.findById(popular.id);
                if (queuedGallery) continue; // this gallery is already queued for uploading
                const uploadedGallery = await GalleryModel.findById(popular.id);
                if (uploadedGallery) continue;

                const newModel = new GalleryPageModel(popular);
                await newModel.save();
                console.log(`Saved to queue: ${popular.id}`);
            } catch (e) {
                console.log(`Failed to query base at grab: ${e.toString()}`);
            }
        }
    }
}
