import { mongoose } from '@typegoose/typegoose';

export const connect = async (mongo: string) => {
    return mongoose.connect(mongo, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    });
};

export * from './gallery';
export * from './channel';
