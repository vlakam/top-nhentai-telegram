import './helpers/env';
import { mongoose } from '@typegoose/typegoose';
import Grabber from './grabber';
import { GalleryPage, GalleryPageModel } from './models';

const { MONGO } = process.env;
const migrate_gallery_multiple_links = async () => {
    const { connection: db } = await mongoose.connect(MONGO!, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    });

    const galleries = db.collection('galleries');
    galleries.find().forEach(async (gallery) => {
        if (gallery.telegraphImages && gallery.telegraphLinks && gallery.ready !== undefined) return;
        gallery.ready = true;
        gallery.telegraphLinks = [gallery.telegraphLink];
        gallery.telegraphImages = [];
        await galleries.save(gallery);
    });
    
    galleries.find().forEach(async (gallery) => {
        gallery.images = gallery.images.flat();
        gallery.telegraphImages = gallery.telegraphImages.flat();
        gallery.thumbs = gallery.thumbs.flat();
        gallery.telegraphLinks = gallery.telegraphLinks.flat();

        await galleries.save(gallery);
    });
};

const migrate_queue = async () => {
    const { connection: db } = await mongoose.connect(MONGO!, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    });

    const grabber = new Grabber();
    const galleryPages = await GalleryPageModel.find({});
    for(const galleryPage of galleryPages) {
        await grabber.processId(galleryPage.id);
    }
};

const migrations = async () => {
    await migrate_gallery_multiple_links();
    await migrate_queue();
}

migrations();
