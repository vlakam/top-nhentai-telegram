import './helpers/env';

import * as NH from './helpers/nhentai';
import Grabber from "./grabber";
import { Publisher } from "./publisher";
import Uploader from "./uploader";
import { connect } from './models';
const { MONGO } = process.env;
(async () => {
    if (!MONGO) throw 'No mongo specified';
    await connect(MONGO);
    const uploader = new Uploader();
    await uploader.init();
    await uploader.process();
})();
