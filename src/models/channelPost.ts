import { getModelForClass, prop } from "@typegoose/typegoose";
import { Channel, ChannelModel } from "./channel";
import { Gallery, GalleryModel } from "./gallery";

export class ChannelPost {
    @prop({ref: ChannelModel, required: true, type: Number})
    channel!: Channel;

    @prop({ref: GalleryModel, required: true, type: Number })
    gallery!: Gallery;

    @prop({ required: true })
    messageId!: number;

    @prop({ default: [], type: Number })
    liked?: number[];

    @prop({ default: [], type: Number })
    disliked?: number[];

    @prop({ default: new Date(), type: Date })
    createdAt?: Date;
}

export const ChannelPostModel = getModelForClass(ChannelPost);

