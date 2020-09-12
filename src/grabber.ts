import * as NH from './helpers/nhentai';

import { GalleryModel, GalleryPageModel } from './models';

export default class Grabber {
    constructor() {}

    async process() {
        console.log('shit, time to grab some shit!');
        const homePage = await NH.getHomepage();
        if (!homePage.popular) {
            console.log('No populars this time ;(');
            return;
        }

        for (const popular of homePage.popular) {
            const queuedGallery = await GalleryPageModel.findById(popular.id);
            if (queuedGallery) continue; // this gallery is already queued for uploading
            const uploadedGallery = await GalleryModel.findById(popular.id);
            if (uploadedGallery) continue;

            const newModel = new GalleryPageModel(popular);
            await newModel.save();
            console.log(`Saved to queue: ${popular.id}`);
        }
    }
}
