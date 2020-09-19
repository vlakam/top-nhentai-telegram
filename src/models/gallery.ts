import { getModelForClass, index, mongoose, prop, Ref } from '@typegoose/typegoose';
import logger from '../helpers/logger';
import { IGallery, IGalleryPage, ITag, Lang } from '../helpers/nhentai';

@index({ _id: 1, name: 1 }, { unique: true })
export class Tag implements ITag {
    @prop({ required: true })
    _id!: number;

    @prop({ required: true })
    name!: string;

    public static async registerTag({ code, name }: ITag) {
        const tag = await TagModel.findById(code);
        if (tag) return tag;

        logger.info(`Registering tag: ${code} - ${name}`);
        return await TagModel.create({ name, _id: code, code });
    }

    public prettyPrintName() {       
        return this.name.replace(/ /g, '_');
    }

    public printHashtag() {
        return `#${this.prettyPrintName()}`;
    }

    public get code() {
        return this._id;
    }

    public set code(code) {
        this._id = code;
    }
}

export const TagModel = getModelForClass(Tag);

export class GalleryPage implements IGalleryPage {
    @prop({ required: true })
    _id!: number;
    @prop({ required: true })
    title!: string;
    @prop({ required: true, type: () => String })
    lang!: Lang;
    @prop({ required: true })
    thumb!: String;

    public get id(): number {
        return this._id;
    }

    public set id(id) {
        this._id = id;
    }
}

export const GalleryPageModel = getModelForClass(GalleryPage);

export class Gallery implements IGallery {
    @prop({ required: true })
    _id!: number;
    @prop({ required: true })
    title!: string;
    @prop({ required: false })
    nativeTitle?: string;
    //@prop({ required: true, type: Number })
    details!: Map<string, Tag[]>;
    @prop({ required: true, type: String })
    thumbs!: string[];
    @prop({ required: true, type: String })
    images!: string[];
    @prop({ required: true, type: String })
    telegraphLinks!: string[];

    @prop({ required: true, type: String })
    telegraphImages!: string[];

    @prop({ required: true, type: () => String })
    lang!: Lang;

    @prop({ required: true, ref: Tag, type: Number })
    tags!: Array<Ref<Tag>>;

    @prop({ required: true, default: false})
    ready!: boolean;

    @prop()
    problematic?: string;

    public get id(): number {
        return this._id;
    }

    public set id(id) {
        this._id = id;
    }
}

export const GalleryModel = getModelForClass(Gallery);
