import './helpers/env';

import * as NH from './helpers/nhentai';
import Grabber from "./grabber";
import { Publisher } from "./publisher";
import Uploader from "./uploader";
import { connect, GalleryModel } from './models';
const { MONGO } = process.env;
(async () => {
    if (!MONGO) throw 'No mongo specified';
    await connect(MONGO);
    // const uploader = new Uploader();
    // await uploader.init();
    // await uploader.process();
    // const publisher = new Publisher();
    // await publisher.process();
    const newGalleries = await GalleryModel.find({ ready: true}).sort({
        uploadedAt: 'asc',
    });
    for(const gallery of newGalleries) console.log(gallery.id, gallery.title, gallery.uploadedAt);
    
    let gallery = await NH.getGalleryInfo(322145);
})();
