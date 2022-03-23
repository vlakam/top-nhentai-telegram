import './helpers/env';
import { mongoose } from '@typegoose/typegoose';
import Grabber from './grabber';
import { GalleryModel, GalleryPage, GalleryPageModel } from './models';
import * as NH from './helpers/nhentai';

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

const migrate_fix_langs = async () => {
    await mongoose.connect(MONGO!, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    });

    const galleries = await GalleryModel.find({});
    for(const gallery of galleries) {
        const { lang: trueLang } = await NH.getGalleryInfo(gallery.id);
        console.log(gallery.id, trueLang);
        gallery.lang = trueLang;

        await gallery.save();
    }
}


const migrate_add_timestamps = async () => {
    await mongoose.connect(MONGO!, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    });

    const galleries = await GalleryModel.find({});
    for(const gallery of galleries) {
        const { uploadedAt } = await NH.getGalleryInfo(gallery.id);
        gallery.createdAt = gallery.createdAt || new Date();
        gallery.uploadedAt = uploadedAt;
        console.log(gallery.id, gallery.title, uploadedAt);

        await gallery.save();
    }
}

const migrate_fix_images_url = async () => {
    await mongoose.connect(MONGO!, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    });

    let galleries = await GalleryModel.find({cannotUpload: { $exists: true }});

    for(const gallery of galleries) {
        const { images } = await NH.getGalleryInfo(gallery.id);
        gallery.images = images;
        gallery.cannotUpload = undefined;
        console.log(gallery.id, gallery.title, images);
        await gallery.save();
    }

    galleries = await GalleryModel.find({problematic: { $exists: true }});

    for(const gallery of galleries) {
        const { images } = await NH.getGalleryInfo(gallery.id);
        gallery.images = images;
        gallery.problematic = undefined;
        console.log(gallery.id, gallery.title, images);
        await gallery.save();
    }
}


const migrations = async () => {
    // await migrate_gallery_multiple_links();
    // await migrate_queue();
    // await migrate_fix_langs();
    //await migrate_add_timestamps();
    await migrate_fix_images_url();
}

migrations();
