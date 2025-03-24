import { createWriteStream } from 'fs';
import { promises as fsPromises } from 'fs';
import { get } from 'https';
import { join } from 'path';

const rootDir = process.cwd();

const downloadTraktDocs = async () => {
    try {
        const docsDir = join(rootDir, '.docs');
        const filePath = join(docsDir, 'trakt.apib');

        try {
            await fsPromises.stat(docsDir);
        } catch {
            await fsPromises.mkdir(docsDir);
        }

        const file = createWriteStream(filePath);
        await new Promise((resolve, reject) => {
            const req = get('https://trakt.docs.apiary.io/api-description-document', (res) => {
                res.pipe(file);
                resolve(res);
            });
            req.on('error', reject);
        });

        await new Promise((resolve, reject) => {
            file.on('finish', (/** @type {any} */ x) => resolve(x));
            file.on('error', reject);
        });

        file.close();
        console.log('Trakt API documentation downloaded successfully');
    } catch (err) {
        console.error('Error downloading Trakt API documentation:', err);
        process.exit(1);
    }
};

downloadTraktDocs();
