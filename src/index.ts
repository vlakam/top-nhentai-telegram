import './helpers/env';

import bot from './helpers/bot';
import { connect } from './models';
import Grabber from './grabber';
import Uploader from './uploader';
import { Publisher } from './publisher';
import logger from './helpers/logger';
const { MONGO } = process.env;

const start = async () => {
    if (!MONGO) throw 'No mongo specified';

    await connect(MONGO);
    await bot.launch();
    logger.info('launched');

    const grabber = new Grabber();
    const uploader = new Uploader();
    const publisher = new Publisher();

    
    await uploader.init();
    await grabber.process();
    await uploader.process();

    grabber.start();
    uploader.start();
    publisher.start();
};

start();
