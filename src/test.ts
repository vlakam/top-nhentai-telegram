import Grabber from "./grabber";
import { Publisher } from "./publisher";
import Uploader from "./uploader";

(async () => {
    await (new Grabber().process());
    await (new Uploader().start());
    await new Publisher().process();
})();