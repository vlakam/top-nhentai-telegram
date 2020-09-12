import { getModelForClass, prop } from '@typegoose/typegoose';

export class Channel {
    @prop({ required: true })
    title!: string;

    @prop({ required: true })
    _id!: number;

    @prop({ required: true, default: false })
    posting!: boolean;

    public static async registerChannel({ id, title }: Pick<Channel, 'id' | 'title'>) {
        const channel = await ChannelModel.findById(id);
        if (channel) return channel;
        
        return await ChannelModel.create({_id: id, title, posting: false});
    }

    public get id() {
        return this._id;
    }

    public set id(id) {
        this._id = id;
    }
}

export const ChannelModel = getModelForClass(Channel);
