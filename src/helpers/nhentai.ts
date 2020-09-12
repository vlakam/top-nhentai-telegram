import fetch from 'node-fetch';
import cheerio from 'cheerio';

const GALLERY_ID_FROM_LINK_REGEX = /\/g\/(\d+)\//;
const baseURL = 'https://nhentai.net';

export enum Lang {
    English = 'EN',
    Japanese = 'JP',
    Chinese = 'CN',
    Unknown = 'UN',
}

export interface ITag {
    code: number;
    name: string;
}

export interface IGallery {
    id: number;
    title: string;
    nativeTitle?: string;
    details: Map<string, Array<ITag>>;
    thumbs: Array<string>;
    images: Array<string>;
}

export interface IGalleryPage {
    id: number;
    title: string;
    lang: Lang;
    thumb: String;
}

export interface INhentaiPage {
    popular?: Array<IGalleryPage>;
    galleries: Array<IGalleryPage>;
}

export const langTags: Record<number, Lang> = {
    12227: Lang.English,
    90412: Lang.Japanese,
    29963: Lang.Chinese,
};

const NHRequest = async (url: string) => {
    const response = await fetch(`${baseURL}/${url}`);
    if (response.status !== 200) throw 'Could not load page';

    return response.text();
};

export const getHomepage = async (page = 1): Promise<INhentaiPage> => {
    const parseGalleryOnPage = (gallery: CheerioElement): IGalleryPage => {
        const $gallery = $(gallery);
        const tags = $gallery.data('tags').split(' ');
        const cover = $gallery.find('img');
        const link = $gallery.find('a');
        const caption = $gallery.find('div');

        const lang = langTags[tags[0]] || langTags[tags[1]] || Lang.Unknown;
        return {
            lang,
            title: caption.text(),
            thumb: cover.data('src'),
            id: parseInt((link.attr('href') || '0').replace(GALLERY_ID_FROM_LINK_REGEX, '$1')),
        };
    };

    const data = await NHRequest(`?page=${page}`);
    const $ = cheerio.load(data);
    const popularItems = $('.index-popular .gallery');
    const pageItems = $('.index-container:not(.index-popular) .gallery');
    const popular = page == 1 ? popularItems.toArray().map(parseGalleryOnPage) : undefined;
    const galleries = pageItems.toArray().map(parseGalleryOnPage);

    return {
        popular,
        galleries,
    };
};

export const getGalleryInfo = async (id: number): Promise<IGallery> => {
    const data = await NHRequest(`g/${id}/`);
    const $ = cheerio.load(data);
    const title = $('h1.title').text();
    const nativeTitle = $('h2.title').text();
    const details = $('.tag-container.field-name')
        .toArray()
        .reduce((acc: Map<string, Array<ITag>>, element: CheerioElement) => {
            const $element = $(element);
            const name = $element.contents().get(0).data.trim().slice(0, -1);
            const features = $element
                .find('.tags .tag')
                .toArray()
                .map((feature) => {
                    const $feature = $(feature);
                    const name = $feature.find('.name').text();
                    let code = 0;
                    let klass;
                    if ((klass = $feature.attr('class'))) {
                        code = parseInt(klass.replace(/.+tag\-(\d+).+/, '$1'));
                    }

                    return { name, code };
                });
            acc.set(name, features);
            return acc;
        }, new Map());

    const thumbs = $('.gallerythumb img')
        .toArray()
        .map((img) => $(img).data('src'));
    const images = thumbs.map((thumbUrl) =>
        thumbUrl.replace(/t(\.(jpg|png|gif))/, '$1').replace('t.nhentai', 'i.nhentai'),
    );

    return { id, title, nativeTitle, details, thumbs, images };
};

export const isGalleryExists = async (galleryID: number): Promise<Boolean> => {
    const pageResponse = await fetch(`${baseURL}/g/${galleryID}/`);
    return pageResponse.status !== 200;
};
