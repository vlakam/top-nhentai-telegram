import { readFile } from 'fs';
import { promisify } from 'util';
import { getRandomUA } from '../constants/ua';
import logger from './logger';

const fetch = require('node-fetch');
const FormData = require('form-data');

export const uploadByUrl = async (url: string) => {
    const response = await fetch(url, {
        headers: {
            'User-Agent': getRandomUA(),
        },
    });
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
        headers: {
            'User-Agent': getRandomUA(),
        },
    });

    if (!response.ok) {
        logger.debug('Response debug data:', response.ok, response.status, response.statusText, response.headers.raw());
        throw new Error(`Failed to upload to telegram: ${response.status}, ${response.statusText}`);
    }

    const result = await response.json();

    if (result.error) throw new Error(result.error);
    if (result[0].src) {
        return {
            link: 'https://telegra.ph' + result[0].src,
            path: result[0].src,
        };
    }

    throw new Error('Unknown error');
};

const readFileAsync = promisify(readFile)
export const uploadFile = async (filePath: string) => {
    const fileBuffer = await readFileAsync(filePath);

    return uploadByBuffer(fileBuffer, 'image/png'); // npmjs.ocom/package/file-type
}