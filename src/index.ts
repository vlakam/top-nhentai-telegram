import './helpers/env';

import bot from './helpers/bot';
import { connect } from './models';
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
    grabber.start();
    uploader.start();
    publisher.start();

    // scheduleJob('*/15 * * * *', async () => {
    //     try {
    //         await uploader.process();
    //     } catch (e) {
    //         console.log(`Uploader failed: ${e.toString()}`);
    //     }
    // });
    // scheduleJob('0 */2 * * *', async () => {
    //     try {
    //         await publisher.process();
    //     } catch (e) {
    //         console.log(`Publisher failed: ${e.toString()}`);
    //     }
    // });
    // scheduleJob('0 */1 * * *', async () => {
    //     try {
    //         await grabber.process();
    //     } catch (e) {
    //         console.log(`Grabber failed: ${e.toString()}`);
    //     }
    // });
};

start();
