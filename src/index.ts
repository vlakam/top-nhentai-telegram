import './helpers/env';

import bot from './helpers/bot';
import { connect } from './models';
import { scheduleJob } from 'node-schedule';
import Grabber from './grabber';
import Uploader from './uploader';
import { Publisher } from './publisher';
const { MONGO } = process.env;
bot.launch();

const start = async () => {
    if (!MONGO) throw 'No mongo specified';

    await connect(MONGO);
    await bot.launch();

    const grabber = new Grabber();
    const uploader = new Uploader();
    const publisher = new Publisher();

    await uploader.init();

    scheduleJob('*/15 * * * *', uploader.process.bind(uploader));
    scheduleJob('*/30 * * * *', publisher.process.bind(publisher));
    scheduleJob('0 */2 * * *', grabber.process.bind(grabber));
};

start();
