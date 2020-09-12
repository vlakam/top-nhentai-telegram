const fetch = require('node-fetch');
const FormData = require('form-data');

export const uploadByUrl = async (url: string) => {
    const response = await fetch(url);
    const buffer = await response.buffer();

    if (!response.headers.get('content-type')) {
        throw new Error('No content types in the response');
    }

    return uploadByBuffer(buffer, response.headers.get('content-type'));
};

export const uploadByBuffer = async (buffer: Buffer, contentType: string) => {
    const form = new FormData();

    form.append('photo', buffer, {
        filename: 'blob',
        contentType,
    });

    const response = await fetch('https://telegra.ph/upload', {
        method: 'POST',
        body: form,
    });

    const result = await response.json();

    if (result.error) throw response.error;
    if (result[0].src) {
        return {
            link: 'https://telegra.ph' + result[0].src,
            path: result[0].src,
        };
    }

    throw new Error('Unknown error');
};

