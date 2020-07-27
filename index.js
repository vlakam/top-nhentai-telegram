const NHentai = require('nhentai-js');
(async () => {
    const a = await NHentai.getDoujin('322174');
    console.log(a);
})()