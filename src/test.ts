import './helpers/env';

import Grabber from "./grabber";
import { Publisher } from "./publisher";
import Uploader from "./uploader";
import { connect } from './models';
const { MONGO } = process.env;
(async () => {
    if (!MONGO) throw 'No mongo specified';
    await connect(MONGO);
    await (new Grabber().process());
    await (new Uploader().start());
    //await new Publisher().process();
})();