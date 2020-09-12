import { getModelForClass, index, mongoose, prop } from '@typegoose/typegoose';
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

        return await TagModel.create({ name, _id: code, code });
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
    @prop({ required: true })
    thumbs!: string[];
    @prop({ required: true })
    images!: string[];
    @prop({ required: true })
    telegraphLink!: string;

    @prop({ required: true, type: () => String })
    lang!: Lang;

    @prop({ required: true, ref: Tag, type: Number })
    tags!: Tag[];

    public get id(): number {
        return this._id;
    }

    public set id(id) {
        this._id = id;
    }
}

export const GalleryModel = getModelForClass(Gallery);
